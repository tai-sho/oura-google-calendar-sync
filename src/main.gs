/**
 * oura-google-calendar-sync
 * Sync Oura Ring data to Google Calendar
 */

// ============================================
// OAuth2 Authentication Functions
// ============================================

/**
 * Get OAuth2 service for Oura API
 * @returns {OAuth2.Service} OAuth2 service
 */
function getOuraService() {
  const config = getConfig();

  return OAuth2.createService('oura')
    .setAuthorizationBaseUrl(OURA_OAUTH.AUTHORIZATION_URL)
    .setTokenUrl(OURA_OAUTH.TOKEN_URL)
    .setClientId(config.ouraClientId)
    .setClientSecret(config.ouraClientSecret)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    // Oura refresh tokens are single-use: serialize refreshes across executions
    // (daily trigger, webhook, manual runs) so that no two use the same token
    .setLock(LockService.getUserLock())
    .setScope(OURA_OAUTH.SCOPES.join(' '));
}

/**
 * Start OAuth2 authorization flow
 * Run this function first to get the authorization URL
 */
function authorizeOura() {
  const config = getConfig();

  if (!config.ouraClientId || !config.ouraClientSecret) {
    logError('authorizeOura', new Error('OURA_CLIENT_ID and OURA_CLIENT_SECRET must be set in Script Properties'));
    return;
  }

  const service = getOuraService();

  if (service.hasAccess()) {
    logInfo('Already authorized. Use logoutOura() to reset.');
    return;
  }

  const authorizationUrl = service.getAuthorizationUrl();
  logInfo('Open the following URL to authorize:\n' + authorizationUrl);
}

/**
 * OAuth2 callback handler
 * This function is called by Oura after user authorization
 * @param {Object} request - The callback request
 * @returns {HtmlOutput} HTML output
 */
function authCallback(request) {
  const service = getOuraService();
  const authorized = service.handleCallback(request);

  if (authorized) {
    return HtmlService.createHtmlOutput('Authorization successful! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Authorization denied. Please try again.');
  }
}

/**
 * Check if Oura is authorized
 * @returns {boolean} True if authorized
 */
function checkOuraAuth() {
  const service = getOuraService();
  const hasAccess = service.hasAccess();

  if (hasAccess) {
    logInfo('Oura is authorized.');
  } else {
    logInfo('Oura is not authorized. Run authorizeOura() to start authorization.');
  }

  return hasAccess;
}

/**
 * Logout from Oura (reset OAuth2 tokens)
 */
function logoutOura() {
  const service = getOuraService();
  service.reset();
  logInfo('Oura authorization has been reset. Run authorizeOura() to re-authorize.');
}

// ============================================
// Sync Functions
// ============================================

/**
 * Thrown when the script lock could not be acquired in time
 */
class LockBusyError extends Error {
  constructor(message) {
    super(message || 'Another sync is running');
    this.name = 'LockBusyError';
  }
}

/**
 * Run a function while holding the script lock, so that concurrent executions
 * (daily trigger, webhook, manual runs) never create the same calendar event twice
 * @param {Function} fn - Function to run
 * @param {number} timeoutMs - How long to wait for the lock
 * @returns {*} Return value of fn
 * @throws {LockBusyError} If the lock could not be acquired
 */
function withScriptLock_(fn, timeoutMs) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(timeoutMs)) {
    throw new LockBusyError();
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Create a SyncService after validating configuration and authorization
 * @returns {SyncService} Sync service
 */
function createSyncService_() {
  const config = getConfig();
  validateConfig(config);

  // Check OAuth2 authorization
  const service = getOuraService();
  if (!service.hasAccess()) {
    const lastError = service.getLastError();
    throw new Error('Not authorized. Run authorizeOura() first.' + (lastError ? ` (${lastError})` : ''));
  }

  return new SyncService(config, service);
}

/**
 * Syncs in execution order. Shared by the full sync and the webhook path.
 * run(syncService, range) - range is optional ({startDate, endDate}, YYYY-MM-DD)
 */
const SYNC_RUNNERS = [
  { name: 'sleep', label: 'Sleep', run: (syncService, range) => syncService.syncSleepData(range) },
  { name: 'workouts', label: 'Workout', run: (syncService, range) => syncService.syncWorkoutData(range) },
  { name: 'dailyScores', label: 'Daily scores', run: (syncService, range) => syncService.syncDailyScoresData(range) },
  { name: 'restMode', label: 'Rest mode', run: (syncService, range) => syncService.syncRestModeData(range) }
];

/**
 * Main entry point - sync all Oura data to Google Calendar
 * Skips (returns null) if another sync keeps running, e.g. a webhook sync
 * @returns {Object|null} Sync results for each data type
 */
function syncOuraToCalendar() {
  try {
    return withScriptLock_(syncAllData_, LOCK_TIMEOUTS.SYNC_MS);
  } catch (e) {
    if (e instanceof LockBusyError) {
      logInfo('Another sync is running. Skipped this run.');
      return null;
    }
    throw e;
  }
}

/**
 * Sync all data types for the last SYNC_DAYS days (caller holds the script lock)
 * @returns {Object} Sync results for each data type
 */
function syncAllData_() {
  logInfo('Starting Oura to Calendar sync...');

  try {
    const syncService = createSyncService_();

    const results = {};

    for (const runner of SYNC_RUNNERS) {
      try {
        logInfo(`Syncing ${runner.label.toLowerCase()}...`);
        results[runner.name] = runner.run(syncService);
        logInfo(`${runner.label} sync complete: ${JSON.stringify(results[runner.name])}`);
      } catch (e) {
        logError(`syncOuraToCalendar:${runner.name}`, e);
        results[runner.name] = { created: 0, updated: 0, skipped: 0, errors: 1 };
      }
    }

    logInfo(`Sync completed: ${JSON.stringify(results)}`);
    return results;
  } catch (e) {
    logError('syncOuraToCalendar', e);
    throw e;
  }
}

/**
 * Run a single sync under the script lock
 * @param {string} label - Label for logs (e.g. 'Sleep')
 * @param {Function} syncFn - Receives a SyncService and returns sync results
 * @returns {Object} Sync results
 */
function runSingleSync_(label, syncFn) {
  logInfo(`Starting ${label.toLowerCase()} sync...`);

  try {
    const results = withScriptLock_(() => syncFn(createSyncService_()), LOCK_TIMEOUTS.SYNC_MS);
    logInfo(`${label} sync complete: ${JSON.stringify(results)}`);
    return results;
  } catch (e) {
    logError(`sync:${label}`, e);
    throw e;
  }
}

/**
 * Sync only sleep data
 * @returns {Object} Sync results
 */
function syncSleep() {
  return runSingleSync_('Sleep', syncService => syncService.syncSleepData());
}

/**
 * Sync only workout data
 * @returns {Object} Sync results
 */
function syncWorkouts() {
  return runSingleSync_('Workout', syncService => syncService.syncWorkoutData());
}

/**
 * Sync only daily scores
 * @returns {Object} Sync results
 */
function syncDailyScores() {
  return runSingleSync_('Daily scores', syncService => syncService.syncDailyScoresData());
}

/**
 * Sync only rest mode periods
 * @returns {Object} Sync results
 */
function syncRestMode() {
  return runSingleSync_('Rest mode', syncService => syncService.syncRestModeData());
}

// ============================================
// Trigger Management
// ============================================

/**
 * Setup daily trigger for automatic sync
 * Runs every day at 8:00 AM
 */
function setupDailyTrigger() {
  // Remove existing triggers
  removeTriggers();

  // Create new daily trigger
  ScriptApp.newTrigger('syncOuraToCalendar')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  logInfo('Daily trigger set for 8:00 AM');
}

/**
 * Remove all triggers for syncOuraToCalendar
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'syncOuraToCalendar') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  logInfo('All syncOuraToCalendar triggers removed');
}

// ============================================
// Test Functions
// ============================================

/**
 * Test Oura API connection
 * Useful for verifying OAuth2 is working
 */
function testOuraConnection() {
  try {
    const config = getConfig();

    const service = getOuraService();
    if (!service.hasAccess()) {
      throw new Error('Not authorized. Run authorizeOura() first.');
    }

    const ouraClient = new OuraApiClient(service, config.ouraApiBaseUrl);
    const today = formatDateForApi(new Date());
    const yesterday = formatDateForApi(new Date(Date.now() - 86400000));

    const sleepData = ouraClient.getDailySleep(yesterday, today);
    logInfo(`Oura API connection successful. Found ${sleepData.length} daily sleep records.`);

    return { success: true, records: sleepData.length };
  } catch (e) {
    logError('testOuraConnection', e);
    return { success: false, error: e.message };
  }
}

/**
 * Test Calendar connection
 * Useful for verifying calendar ID is correct
 */
function testCalendarConnection() {
  try {
    const config = getConfig();

    if (!config.calendarId) {
      throw new Error('CALENDAR_ID is not set');
    }

    const calendarService = new CalendarService(config.calendarId);
    const calendar = calendarService.getCalendar();
    const calendarName = calendar.getName();

    logInfo(`Calendar connection successful. Calendar name: ${calendarName}`);

    return { success: true, calendarName: calendarName };
  } catch (e) {
    logError('testCalendarConnection', e);
    return { success: false, error: e.message };
  }
}
