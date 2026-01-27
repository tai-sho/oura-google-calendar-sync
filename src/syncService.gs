/**
 * Sync Service for Oura to Google Calendar synchronization
 */

/**
 * SyncService class for managing data synchronization
 */
class SyncService {
  /**
   * @param {Object} config - Configuration object
   * @param {OAuth2.Service} oauthService - OAuth2 service for Oura
   */
  constructor(config, oauthService) {
    this.config = config;
    this.ouraClient = new OuraApiClient(oauthService, config.ouraApiBaseUrl);
    this.calendarService = new CalendarService(config.calendarId);
  }

  /**
   * Sync sleep data to calendar
   * @returns {Object} Sync results {created, updated, skipped, errors}
   */
  syncSleepData() {
    const { startDate, endDate, searchStartDate, searchEndDate } = this._getDateRange();
    const results = { created: 0, updated: 0, skipped: 0, errors: 0 };

    try {
      const sleepData = this.ouraClient.getSleep(startDate, endDate);
      const dailySleepData = this.ouraClient.getDailySleep(startDate, endDate);

      // Index daily sleep by day
      const dailySleepByDay = {};
      for (const ds of dailySleepData) {
        dailySleepByDay[ds.day] = ds;
      }

      for (const sleep of sleepData) {
        try {
          const dailySleep = dailySleepByDay[sleep.day];
          const formatted = formatSleepEvent(sleep, dailySleep);

          const startTime = parseISODateTime(sleep.bedtime_start);
          const endTime = parseISODateTime(sleep.bedtime_end);

          if (!startTime || !endTime) {
            logError('syncSleepData', new Error(`Invalid sleep times for ${sleep.id}`));
            results.errors++;
            continue;
          }

          const result = this.calendarService.createOrUpdateEvent(
            sleep.id,
            formatted.title,
            startTime,
            endTime,
            formatted.description,
            { color: CalendarApp.EventColor.BLUE },
            searchStartDate,
            searchEndDate
          );

          if (result === 'created') results.created++;
          else if (result === 'updated') results.updated++;
          else results.skipped++;
        } catch (e) {
          logError('syncSleepData:item', e);
          results.errors++;
        }
      }
    } catch (e) {
      logError('syncSleepData', e);
      throw e;
    }

    return results;
  }

  /**
   * Sync workout data to calendar
   * @returns {Object} Sync results {created, updated, skipped, errors}
   */
  syncWorkoutData() {
    const { startDate, endDate, searchStartDate, searchEndDate } = this._getDateRange();
    const results = { created: 0, updated: 0, skipped: 0, errors: 0 };

    try {
      const workouts = this.ouraClient.getWorkouts(startDate, endDate);

      for (const workout of workouts) {
        try {
          const formatted = formatWorkoutEvent(workout);

          const startTime = parseISODateTime(workout.start_datetime);
          const endTime = parseISODateTime(workout.end_datetime);

          if (!startTime || !endTime) {
            logError('syncWorkoutData', new Error(`Invalid workout times for ${workout.id}`));
            results.errors++;
            continue;
          }

          const result = this.calendarService.createOrUpdateEvent(
            workout.id,
            formatted.title,
            startTime,
            endTime,
            formatted.description,
            { color: CalendarApp.EventColor.ORANGE },
            searchStartDate,
            searchEndDate
          );

          if (result === 'created') results.created++;
          else if (result === 'updated') results.updated++;
          else results.skipped++;
        } catch (e) {
          logError('syncWorkoutData:item', e);
          results.errors++;
        }
      }
    } catch (e) {
      logError('syncWorkoutData', e);
      throw e;
    }

    return results;
  }

  /**
   * Sync daily scores data to calendar
   * @returns {Object} Sync results {created, updated, skipped, errors}
   */
  syncDailyScoresData() {
    const { startDate, endDate, searchStartDate, searchEndDate } = this._getDateRange();
    const results = { created: 0, updated: 0, skipped: 0, errors: 0 };

    try {
      const readinessData = this.ouraClient.getDailyReadiness(startDate, endDate);
      const stressData = this.ouraClient.getDailyStress(startDate, endDate);
      const dailySleepData = this.ouraClient.getDailySleep(startDate, endDate);
      const activityData = this.ouraClient.getDailyActivity(startDate, endDate);

      // SpO2 may not be available for all users (requires specific scope or subscription)
      let spo2Data = [];
      try {
        spo2Data = this.ouraClient.getDailySpo2(startDate, endDate);
      } catch (e) {
        logInfo('SpO2 data not available: ' + e.message);
      }

      // Sleep time recommendation
      let sleepTimeData = [];
      try {
        sleepTimeData = this.ouraClient.getSleepTime(startDate, endDate);
      } catch (e) {
        logInfo('Sleep time data not available: ' + e.message);
      }

      // Index by day
      const readinessByDay = {};
      const stressByDay = {};
      const dailySleepByDay = {};
      const activityByDay = {};
      const spo2ByDay = {};
      const sleepTimeByDay = {};

      for (const r of readinessData) readinessByDay[r.day] = r;
      for (const s of stressData) stressByDay[s.day] = s;
      for (const ds of dailySleepData) dailySleepByDay[ds.day] = ds;
      for (const a of activityData) activityByDay[a.day] = a;
      for (const sp of spo2Data) spo2ByDay[sp.day] = sp;
      for (const st of sleepTimeData) sleepTimeByDay[st.day] = st;

      // Collect all unique days
      const allDays = new Set([
        ...readinessData.map(r => r.day),
        ...stressData.map(s => s.day),
        ...dailySleepData.map(ds => ds.day),
        ...activityData.map(a => a.day),
        ...spo2Data.map(sp => sp.day),
        ...sleepTimeData.map(st => st.day)
      ]);

      for (const day of allDays) {
        try {
          const readiness = readinessByDay[day];
          const stress = stressByDay[day];
          const dailySleep = dailySleepByDay[day];
          const activity = activityByDay[day];
          const spo2 = spo2ByDay[day];
          const sleepTime = sleepTimeByDay[day];

          // Skip if no data
          if (!readiness && !stress && !dailySleep && !activity && !spo2 && !sleepTime) continue;

          const formatted = formatDailyScoreEvent(readiness, stress, dailySleep, activity, spo2, sleepTime);
          const ouraId = `daily_score_${day}`;
          const eventDate = new Date(day + 'T00:00:00');

          const result = this.calendarService.createOrUpdateAllDayEvent(
            ouraId,
            formatted.title,
            eventDate,
            formatted.description,
            { color: CalendarApp.EventColor.GREEN },
            searchStartDate,
            searchEndDate
          );

          if (result === 'created') results.created++;
          else if (result === 'updated') results.updated++;
          else results.skipped++;
        } catch (e) {
          logError('syncDailyScoresData:item', e);
          results.errors++;
        }
      }
    } catch (e) {
      logError('syncDailyScoresData', e);
      throw e;
    }

    return results;
  }

  /**
   * Sync rest mode periods to calendar
   * @returns {Object} Sync results {created, updated, skipped, errors}
   */
  syncRestModeData() {
    const { startDate, endDate, searchStartDate, searchEndDate } = this._getDateRange();
    const results = { created: 0, updated: 0, skipped: 0, errors: 0 };

    try {
      const restModeData = this.ouraClient.getRestModePeriods(startDate, endDate);

      for (const restMode of restModeData) {
        try {
          const formatted = formatRestModeEvent(restMode);

          // Parse start and end dates
          const eventStartDate = new Date(restMode.start_day + 'T00:00:00');
          // End date needs to be +1 day for Google Calendar's all-day event (exclusive end)
          const eventEndDate = new Date(restMode.end_day + 'T00:00:00');
          eventEndDate.setDate(eventEndDate.getDate() + 1);

          const result = this.calendarService.createOrUpdateMultiDayAllDayEvent(
            restMode.id,
            formatted.title,
            eventStartDate,
            eventEndDate,
            formatted.description,
            { color: CalendarApp.EventColor.GRAPE },
            searchStartDate,
            searchEndDate
          );

          if (result === 'created') results.created++;
          else if (result === 'updated') results.updated++;
          else results.skipped++;
        } catch (e) {
          logError('syncRestModeData:item', e);
          results.errors++;
        }
      }
    } catch (e) {
      logError('syncRestModeData', e);
      throw e;
    }

    return results;
  }

  /**
   * Calculate date range for sync
   * @returns {Object} Date range {startDate, endDate, searchStartDate, searchEndDate}
   * @private
   */
  _getDateRange() {
    const now = new Date();
    const endDate = formatDateForApi(now);

    const startDateObj = new Date(now);
    startDateObj.setDate(startDateObj.getDate() - this.config.syncDays);
    const startDate = formatDateForApi(startDateObj);

    // Search range with buffer
    const searchStartDate = new Date(startDateObj);
    searchStartDate.setDate(searchStartDate.getDate() - 1);

    const searchEndDate = new Date(now);
    searchEndDate.setDate(searchEndDate.getDate() + 1);

    return { startDate, endDate, searchStartDate, searchEndDate };
  }
}
