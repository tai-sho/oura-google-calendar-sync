/**
 * Configuration management for Oura Google Calendar Sync
 */

const CONFIG_KEYS = {
  OURA_ACCESS_TOKEN: 'OURA_ACCESS_TOKEN',
  CALENDAR_ID: 'CALENDAR_ID',
  SYNC_DAYS: 'SYNC_DAYS'
};

const DEFAULTS = {
  SYNC_DAYS: 7,
  OURA_API_BASE_URL: 'https://api.ouraring.com'
};

/**
 * Get all configuration values
 * @returns {Object} Configuration object
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    ouraAccessToken: props.getProperty(CONFIG_KEYS.OURA_ACCESS_TOKEN),
    calendarId: props.getProperty(CONFIG_KEYS.CALENDAR_ID),
    syncDays: parseInt(props.getProperty(CONFIG_KEYS.SYNC_DAYS)) || DEFAULTS.SYNC_DAYS,
    ouraApiBaseUrl: DEFAULTS.OURA_API_BASE_URL
  };
}

/**
 * Set a configuration value
 * @param {string} key - Configuration key
 * @param {string} value - Configuration value
 */
function setConfig(key, value) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(key, value);
}

/**
 * Validate configuration
 * @param {Object} config - Configuration object
 * @throws {Error} If required configuration is missing
 */
function validateConfig(config) {
  const errors = [];

  if (!config.ouraAccessToken) {
    errors.push('OURA_ACCESS_TOKEN is not set');
  }

  if (!config.calendarId) {
    errors.push('CALENDAR_ID is not set');
  }

  if (errors.length > 0) {
    throw new Error('Configuration errors:\n' + errors.join('\n'));
  }
}
