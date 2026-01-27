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
 * Main entry point - sync all Oura data to Google Calendar
 * @returns {Object} Sync results for each data type
 */
function syncOuraToCalendar() {
  logInfo('Starting Oura to Calendar sync...');

  try {
    const config = getConfig();
    validateConfig(config);

    // Check OAuth2 authorization
    const service = getOuraService();
    if (!service.hasAccess()) {
      throw new Error('Not authorized. Run authorizeOura() first.');
    }

    const syncService = new SyncService(config, service);

    const results = {
      sleep: { created: 0, updated: 0, skipped: 0, errors: 0 },
      workouts: { created: 0, updated: 0, skipped: 0, errors: 0 },
      dailyScores: { created: 0, updated: 0, skipped: 0, errors: 0 },
      restMode: { created: 0, updated: 0, skipped: 0, errors: 0 }
    };

    // Sync sleep data
    try {
      logInfo('Syncing sleep data...');
      results.sleep = syncService.syncSleepData();
      logInfo(`Sleep sync complete: ${JSON.stringify(results.sleep)}`);
    } catch (e) {
      logError('syncOuraToCalendar:sleep', e);
      results.sleep.errors++;
    }

    // Sync workout data
    try {
      logInfo('Syncing workout data...');
      results.workouts = syncService.syncWorkoutData();
      logInfo(`Workout sync complete: ${JSON.stringify(results.workouts)}`);
    } catch (e) {
      logError('syncOuraToCalendar:workouts', e);
      results.workouts.errors++;
    }

    // Sync daily scores
    try {
      logInfo('Syncing daily scores...');
      results.dailyScores = syncService.syncDailyScoresData();
      logInfo(`Daily scores sync complete: ${JSON.stringify(results.dailyScores)}`);
    } catch (e) {
      logError('syncOuraToCalendar:dailyScores', e);
      results.dailyScores.errors++;
    }

    // Sync rest mode periods
    try {
      logInfo('Syncing rest mode periods...');
      results.restMode = syncService.syncRestModeData();
      logInfo(`Rest mode sync complete: ${JSON.stringify(results.restMode)}`);
    } catch (e) {
      logError('syncOuraToCalendar:restMode', e);
      results.restMode.errors++;
    }

    logInfo(`Sync completed: ${JSON.stringify(results)}`);
    return results;
  } catch (e) {
    logError('syncOuraToCalendar', e);
    throw e;
  }
}

/**
 * Sync only sleep data
 * @returns {Object} Sync results
 */
function syncSleep() {
  logInfo('Starting sleep sync...');

  try {
    const config = getConfig();
    validateConfig(config);

    const service = getOuraService();
    if (!service.hasAccess()) {
      throw new Error('Not authorized. Run authorizeOura() first.');
    }

    const syncService = new SyncService(config, service);
    const results = syncService.syncSleepData();

    logInfo(`Sleep sync complete: ${JSON.stringify(results)}`);
    return results;
  } catch (e) {
    logError('syncSleep', e);
    throw e;
  }
}

/**
 * Sync only workout data
 * @returns {Object} Sync results
 */
function syncWorkouts() {
  logInfo('Starting workout sync...');

  try {
    const config = getConfig();
    validateConfig(config);

    const service = getOuraService();
    if (!service.hasAccess()) {
      throw new Error('Not authorized. Run authorizeOura() first.');
    }

    const syncService = new SyncService(config, service);
    const results = syncService.syncWorkoutData();

    logInfo(`Workout sync complete: ${JSON.stringify(results)}`);
    return results;
  } catch (e) {
    logError('syncWorkouts', e);
    throw e;
  }
}

/**
 * Sync only daily scores
 * @returns {Object} Sync results
 */
function syncDailyScores() {
  logInfo('Starting daily scores sync...');

  try {
    const config = getConfig();
    validateConfig(config);

    const service = getOuraService();
    if (!service.hasAccess()) {
      throw new Error('Not authorized. Run authorizeOura() first.');
    }

    const syncService = new SyncService(config, service);
    const results = syncService.syncDailyScoresData();

    logInfo(`Daily scores sync complete: ${JSON.stringify(results)}`);
    return results;
  } catch (e) {
    logError('syncDailyScores', e);
    throw e;
  }
}

/**
 * Sync only rest mode periods
 * @returns {Object} Sync results
 */
function syncRestMode() {
  logInfo('Starting rest mode sync...');

  try {
    const config = getConfig();
    validateConfig(config);

    const service = getOuraService();
    if (!service.hasAccess()) {
      throw new Error('Not authorized. Run authorizeOura() first.');
    }

    const syncService = new SyncService(config, service);
    const results = syncService.syncRestModeData();

    logInfo(`Rest mode sync complete: ${JSON.stringify(results)}`);
    return results;
  } catch (e) {
    logError('syncRestMode', e);
    throw e;
  }
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
