/**
 * Google Calendar Service for Oura data synchronization
 */

/**
 * CalendarService class for Google Calendar operations
 */
class CalendarService {
  /**
   * @param {string} calendarId - Google Calendar ID
   */
  constructor(calendarId) {
    this.calendarId = calendarId;
    this._calendar = null;
    // Events of the last searched window, reused while a sync walks its items
    this._eventCache = null;
  }

  /**
   * Get calendar instance
   * @returns {Calendar} Google Calendar instance
   */
  getCalendar() {
    if (!this._calendar) {
      this._calendar = CalendarApp.getCalendarById(this.calendarId);
      if (!this._calendar) {
        throw new Error(`Calendar not found: ${this.calendarId}`);
      }
    }
    return this._calendar;
  }

  /**
   * Find event by Oura ID within date range
   * @param {string} ouraId - Oura ID to search for
   * @param {Date} searchStartDate - Search start date
   * @param {Date} searchEndDate - Search end date
   * @returns {CalendarEvent|null} Found event or null
   */
  findEventByOuraId(ouraId, searchStartDate, searchEndDate) {
    const cacheKey = `${searchStartDate.getTime()}-${searchEndDate.getTime()}`;
    if (!this._eventCache || this._eventCache.key !== cacheKey) {
      this._eventCache = { key: cacheKey, events: this.getCalendar().getEvents(searchStartDate, searchEndDate) };
    }

    for (const event of this._eventCache.events) {
      const description = event.getDescription();
      if (extractOuraIdFromDescription(description) === ouraId) {
        return event;
      }
    }
    return null;
  }

  /**
   * Create a timed event
   * @param {string} title - Event title
   * @param {Date} startTime - Event start time
   * @param {Date} endTime - Event end time
   * @param {string} description - Event description
   * @param {Object} options - Additional options (color)
   * @returns {CalendarEvent} Created event
   */
  createEvent(title, startTime, endTime, description, options = {}) {
    const calendar = this.getCalendar();
    this._eventCache = null;
    const event = calendar.createEvent(title, startTime, endTime, {
      description: description
    });

    if (options.color) {
      event.setColor(options.color);
    }

    return event;
  }

  /**
   * Update an existing event
   * @param {CalendarEvent} event - Event to update
   * @param {string} title - New title
   * @param {Date} startTime - New start time
   * @param {Date} endTime - New end time
   * @param {string} description - New description
   * @returns {boolean} False if the event already had these values (nothing written)
   */
  updateEvent(event, title, startTime, endTime, description) {
    if (event.getTitle() === title &&
        event.getDescription() === description &&
        event.getStartTime().getTime() === startTime.getTime() &&
        event.getEndTime().getTime() === endTime.getTime()) {
      return false;
    }
    event.setTitle(title);
    event.setTime(startTime, endTime);
    event.setDescription(description);
    return true;
  }

  /**
   * Create an all-day event
   * @param {string} title - Event title
   * @param {Date} date - Event date
   * @param {string} description - Event description
   * @param {Object} options - Additional options (color)
   * @returns {CalendarEvent} Created event
   */
  createAllDayEvent(title, date, description, options = {}) {
    const calendar = this.getCalendar();
    this._eventCache = null;
    const event = calendar.createAllDayEvent(title, date, {
      description: description
    });

    if (options.color) {
      event.setColor(options.color);
    }

    return event;
  }

  /**
   * Update an all-day event
   * @param {CalendarEvent} event - Event to update
   * @param {string} title - New title
   * @param {string} description - New description
   * @returns {boolean} False if the event already had these values (nothing written)
   */
  updateAllDayEvent(event, title, description) {
    if (event.getTitle() === title && event.getDescription() === description) {
      return false;
    }
    event.setTitle(title);
    event.setDescription(description);
    return true;
  }

  /**
   * Create or update an event based on Oura ID
   * @param {string} ouraId - Oura ID
   * @param {string} title - Event title
   * @param {Date} startTime - Event start time
   * @param {Date} endTime - Event end time
   * @param {string} description - Event description
   * @param {Object} options - Additional options
   * @param {Date} searchStartDate - Search start date
   * @param {Date} searchEndDate - Search end date
   * @returns {string} Result: 'created', 'updated' or 'skipped' (unchanged)
   */
  createOrUpdateEvent(ouraId, title, startTime, endTime, description, options, searchStartDate, searchEndDate) {
    const descriptionWithId = appendOuraIdToDescription(description, ouraId);
    const existingEvent = this.findEventByOuraId(ouraId, searchStartDate, searchEndDate);

    if (existingEvent) {
      return this.updateEvent(existingEvent, title, startTime, endTime, descriptionWithId) ? 'updated' : 'skipped';
    } else {
      this.createEvent(title, startTime, endTime, descriptionWithId, options);
      return 'created';
    }
  }

  /**
   * Create or update an all-day event based on Oura ID
   * @param {string} ouraId - Oura ID
   * @param {string} title - Event title
   * @param {Date} date - Event date
   * @param {string} description - Event description
   * @param {Object} options - Additional options
   * @param {Date} searchStartDate - Search start date
   * @param {Date} searchEndDate - Search end date
   * @returns {string} Result: 'created', 'updated' or 'skipped' (unchanged)
   */
  createOrUpdateAllDayEvent(ouraId, title, date, description, options, searchStartDate, searchEndDate) {
    const descriptionWithId = appendOuraIdToDescription(description, ouraId);
    const existingEvent = this.findEventByOuraId(ouraId, searchStartDate, searchEndDate);

    if (existingEvent) {
      return this.updateAllDayEvent(existingEvent, title, descriptionWithId) ? 'updated' : 'skipped';
    } else {
      this.createAllDayEvent(title, date, descriptionWithId, options);
      return 'created';
    }
  }

  /**
   * Create a multi-day all-day event
   * @param {string} title - Event title
   * @param {Date} startDate - Event start date
   * @param {Date} endDate - Event end date (exclusive, event ends on this day)
   * @param {string} description - Event description
   * @param {Object} options - Additional options (color)
   * @returns {CalendarEvent} Created event
   */
  createMultiDayAllDayEvent(title, startDate, endDate, description, options = {}) {
    const calendar = this.getCalendar();
    this._eventCache = null;
    const event = calendar.createAllDayEvent(title, startDate, endDate, {
      description: description
    });

    if (options.color) {
      event.setColor(options.color);
    }

    return event;
  }

  /**
   * Update a multi-day all-day event
   * @param {CalendarEvent} event - Event to update
   * @param {string} title - New title
   * @param {Date} startDate - New start date
   * @param {Date} endDate - New end date
   * @param {string} description - New description
   * @returns {boolean} False if the event already had these values (nothing written)
   */
  updateMultiDayAllDayEvent(event, title, startDate, endDate, description) {
    // getAllDayEndDate() is exclusive, like endDate
    if (event.getTitle() === title &&
        event.getDescription() === description &&
        event.getAllDayStartDate().getTime() === startDate.getTime() &&
        event.getAllDayEndDate().getTime() === endDate.getTime()) {
      return false;
    }
    event.setTitle(title);
    event.setAllDayDates(startDate, endDate);
    event.setDescription(description);
    return true;
  }

  /**
   * Create or update a multi-day all-day event based on Oura ID
   * @param {string} ouraId - Oura ID
   * @param {string} title - Event title
   * @param {Date} startDate - Event start date
   * @param {Date} endDate - Event end date (exclusive)
   * @param {string} description - Event description
   * @param {Object} options - Additional options
   * @param {Date} searchStartDate - Search start date
   * @param {Date} searchEndDate - Search end date
   * @returns {string} Result: 'created', 'updated' or 'skipped' (unchanged)
   */
  createOrUpdateMultiDayAllDayEvent(ouraId, title, startDate, endDate, description, options, searchStartDate, searchEndDate) {
    const descriptionWithId = appendOuraIdToDescription(description, ouraId);
    const existingEvent = this.findEventByOuraId(ouraId, searchStartDate, searchEndDate);

    if (existingEvent) {
      return this.updateMultiDayAllDayEvent(existingEvent, title, startDate, endDate, descriptionWithId) ? 'updated' : 'skipped';
    } else {
      this.createMultiDayAllDayEvent(title, startDate, endDate, descriptionWithId, options);
      return 'created';
    }
  }
}
