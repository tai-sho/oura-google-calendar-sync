/**
 * Webhook entry point (Apps Script web app)
 *
 * Oura webhooks are received by the relay (oura-google-calendar-sync-webhook),
 * which verifies their signatures and forwards them here in batches:
 *
 *   POST {"secret": "...", "events": [{event_type, data_type, object_id, event_time, user_id}, ...]}
 *
 * The response is always JSON (the relay treats anything else as a failure):
 *   {"ok": true, "results": {...}}
 *   {"ok": false, "retry": true}      another sync holds the script lock
 *   {"ok": false, "error": "auth"}    shared secret mismatch
 *   {"ok": false, "error": "..."}     processing error (the relay retries)
 */

/**
 * Syncs to run for each Oura data_type
 */
const WEBHOOK_SYNC_TARGETS = {
  sleep: ['sleep'],
  daily_sleep: ['sleep', 'dailyScores'],
  daily_readiness: ['dailyScores'],
  daily_activity: ['dailyScores'],
  daily_stress: ['dailyScores'],
  daily_spo2: ['dailyScores'],
  sleep_time: ['dailyScores'],
  workout: ['workouts'],
  rest_mode_period: ['restMode']
};

/**
 * Sync runners in execution order
 */
const WEBHOOK_SYNC_RUNNERS = [
  { name: 'sleep', run: (syncService, range) => syncService.syncSleepData(range) },
  { name: 'workouts', run: (syncService, range) => syncService.syncWorkoutData(range) },
  { name: 'dailyScores', run: (syncService, range) => syncService.syncDailyScoresData(range) },
  { name: 'restMode', run: (syncService, range) => syncService.syncRestModeData(range) }
];

/**
 * Web app POST handler
 * @param {Object} e - Apps Script event object
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  try {
    const request = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (!isValidWebhookSecret_(request.secret)) {
      logError('doPost', new Error('Invalid webhook secret'));
      return jsonResponse_({ ok: false, error: 'auth' });
    }

    const events = Array.isArray(request.events) ? request.events : [];
    if (events.length === 0) {
      // Health check from the relay (bin/doctor.php)
      return jsonResponse_({ ok: true, results: {} });
    }

    const results = withScriptLock_(() => processWebhookEvents(events), LOCK_TIMEOUTS.WEBHOOK_MS);
    return jsonResponse_({ ok: true, results: results });
  } catch (err) {
    if (err instanceof LockBusyError) {
      logInfo('Webhook: another sync is running, asking the relay to retry later.');
      return jsonResponse_({ ok: false, retry: true });
    }
    logError('doPost', err);
    return jsonResponse_({ ok: false, error: err.message || String(err) });
  }
}

/**
 * Sync the data affected by a batch of webhook events (caller holds the script lock)
 * @param {Array<Object>} events - Oura webhook events
 * @returns {Object} Sync results per sync type
 * @throws {Error} If any sync failed, so that the relay retries the batch
 */
function processWebhookEvents(events) {
  logInfo(`Webhook: received ${events.length} event(s): ` +
    events.map(event => `${event.event_type}:${event.data_type}`).join(', '));

  const ranges = buildWebhookSyncRanges_(events);
  const results = {};
  const failures = [];
  let syncService = null;

  for (const runner of WEBHOOK_SYNC_RUNNERS) {
    const range = ranges[runner.name];
    if (!range) continue;

    try {
      syncService = syncService || createSyncService_();
      results[runner.name] = runner.run(syncService, range);
      logInfo(`Webhook ${runner.name} sync ${range.startDate}..${range.endDate}: ${JSON.stringify(results[runner.name])}`);
    } catch (e) {
      logError(`processWebhookEvents:${runner.name}`, e);
      failures.push(`${runner.name}: ${e.message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join('; '));
  }
  return results;
}

/**
 * Work out which syncs to run and for which dates.
 * Oura documents are not fetched: the date of each event is enough to narrow the sync,
 * and older changes are picked up by the daily sync.
 * @param {Array<Object>} events - Oura webhook events
 * @returns {Object} Date range {startDate, endDate} per sync name
 * @private
 */
function buildWebhookSyncRanges_(events) {
  const today = formatDateForApi(new Date());
  const ranges = {};

  for (const event of events) {
    if (!event || typeof event !== 'object') continue;

    if (event.event_type === 'delete') {
      // Not synced yet: logged to see whether Oura replaces document IDs
      logInfo(`Webhook delete event (not synced): ${event.data_type} ${event.object_id}`);
      continue;
    }

    const targets = WEBHOOK_SYNC_TARGETS[event.data_type];
    if (!targets) {
      logInfo(`Webhook: unsupported data_type ignored: ${event.data_type}`);
      continue;
    }

    const eventDate = new Date(event.event_time);
    const day = isNaN(eventDate.getTime()) ? today : formatDateForApi(eventDate);

    for (const target of targets) {
      const range = target === 'restMode'
        ? { startDate: addDaysToApiDate(today, -WEBHOOK.REST_MODE_DAYS), endDate: addDaysToApiDate(today, 1) }
        : { startDate: addDaysToApiDate(day, -WEBHOOK.DAYS_BEFORE), endDate: addDaysToApiDate(day, WEBHOOK.DAYS_AFTER) };
      ranges[target] = mergeDateRanges_(ranges[target], range);
    }
  }

  return ranges;
}

/**
 * Merge two date ranges (YYYY-MM-DD strings compare chronologically)
 * @param {Object|undefined} a - Date range or undefined
 * @param {Object} b - Date range
 * @returns {Object} Range covering both
 * @private
 */
function mergeDateRanges_(a, b) {
  if (!a) return b;
  return {
    startDate: a.startDate < b.startDate ? a.startDate : b.startDate,
    endDate: a.endDate > b.endDate ? a.endDate : b.endDate
  };
}

/**
 * Compare the request secret with WEBHOOK_SHARED_SECRET in constant time
 * @param {*} secret - Secret from the request
 * @returns {boolean} True if it matches
 * @private
 */
function isValidWebhookSecret_(secret) {
  const expected = getConfig().webhookSharedSecret;
  if (!expected || typeof secret !== 'string' || secret.length !== expected.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * @param {Object} data - Response body
 * @returns {TextOutput} JSON output
 * @private
 */
function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Manually test the webhook sync path from the GAS editor
 * (simulates sleep and readiness updates for today)
 * @returns {Object} Sync results
 */
function testProcessWebhookEvents() {
  const now = new Date().toISOString();
  const results = withScriptLock_(() => processWebhookEvents([
    { event_type: 'update', data_type: 'sleep', object_id: 'manual-test', event_time: now },
    { event_type: 'update', data_type: 'daily_readiness', object_id: 'manual-test', event_time: now }
  ]), LOCK_TIMEOUTS.SYNC_MS);

  logInfo(`Webhook test complete: ${JSON.stringify(results)}`);
  return results;
}
