/**
 * oura-google-calendar-sync
 * Sync Oura Ring data to Google Calendar
 */

/**
 * Main entry point - sync all Oura data to Google Calendar
 * @returns {Object} Sync results for each data type
 */
function syncOuraToCalendar() {
  logInfo('Starting Oura to Calendar sync...');

  try {
    const config = getConfig();
    validateConfig(config);

    const syncService = new SyncService(config);

    const results = {
      sleep: { created: 0, updated: 0, skipped: 0, errors: 0 },
      workouts: { created: 0, updated: 0, skipped: 0, errors: 0 },
      dailyScores: { created: 0, updated: 0, skipped: 0, errors: 0 }
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

    const syncService = new SyncService(config);
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

    const syncService = new SyncService(config);
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

    const syncService = new SyncService(config);
    const results = syncService.syncDailyScoresData();

    logInfo(`Daily scores sync complete: ${JSON.stringify(results)}`);
    return results;
  } catch (e) {
    logError('syncDailyScores', e);
    throw e;
  }
}

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

/**
 * Test Oura API connection
 * Useful for verifying token is working
 */
function testOuraConnection() {
  try {
    const config = getConfig();

    if (!config.ouraAccessToken) {
      throw new Error('OURA_ACCESS_TOKEN is not set');
    }

    const ouraClient = new OuraApiClient(config.ouraAccessToken, config.ouraApiBaseUrl);
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
