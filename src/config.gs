/**
 * Configuration management for Oura Google Calendar Sync
 */

const CONFIG_KEYS = {
  OURA_CLIENT_ID: 'OURA_CLIENT_ID',
  OURA_CLIENT_SECRET: 'OURA_CLIENT_SECRET',
  CALENDAR_ID: 'CALENDAR_ID',
  SYNC_DAYS: 'SYNC_DAYS'
};

const DEFAULTS = {
  SYNC_DAYS: 7,
  OURA_API_BASE_URL: 'https://api.ouraring.com'
};

const OURA_OAUTH = {
  AUTHORIZATION_URL: 'https://cloud.ouraring.com/oauth/authorize',
  TOKEN_URL: 'https://api.ouraring.com/oauth/token',
  SCOPES: ['email', 'personal', 'daily', 'heartrate', 'workout', 'tag', 'session', 'spo2']
};

/**
 * Get all configuration values
 * @returns {Object} Configuration object
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    ouraClientId: props.getProperty(CONFIG_KEYS.OURA_CLIENT_ID),
    ouraClientSecret: props.getProperty(CONFIG_KEYS.OURA_CLIENT_SECRET),
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
 * Validate configuration for OAuth2
 * @param {Object} config - Configuration object
 * @throws {Error} If required configuration is missing
 */
function validateConfig(config) {
  const errors = [];

  if (!config.ouraClientId) {
    errors.push('OURA_CLIENT_ID is not set');
  }

  if (!config.ouraClientSecret) {
    errors.push('OURA_CLIENT_SECRET is not set');
  }

  if (!config.calendarId) {
    errors.push('CALENDAR_ID is not set');
  }

  if (errors.length > 0) {
    throw new Error('Configuration errors:\n' + errors.join('\n'));
  }
}
