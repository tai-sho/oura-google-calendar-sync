/**
 * Utility functions for Oura Google Calendar Sync
 */

/**
 * Parse ISO 8601 datetime string to Date object
 * @param {string} isoString - ISO 8601 datetime string
 * @returns {Date|null} Date object or null if invalid
 */
function parseISODateTime(isoString) {
  if (!isoString) return null;
  return new Date(isoString);
}

/**
 * Format Date to API date string (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse an API date string (YYYY-MM-DD) as local midnight in the script time zone
 * (new Date('YYYY-MM-DD') would be parsed as UTC)
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @returns {Date} Date object
 */
function parseApiDate(dateString) {
  return new Date(dateString + 'T00:00:00');
}

/**
 * Add days to an API date string
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @param {number} days - Number of days to add (negative to subtract)
 * @returns {string} Date string (YYYY-MM-DD)
 */
function addDaysToApiDate(dateString, days) {
  const date = parseApiDate(dateString);
  date.setDate(date.getDate() + days);
  return formatDateForApi(date);
}

/**
 * Format duration in seconds to human readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "7h 30m")
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Log error with context
 * @param {string} context - Error context
 * @param {Error} error - Error object
 */
function logError(context, error) {
  console.error(`[ERROR][${context}] ${error.message}`);
  if (error.stack) {
    console.error(error.stack);
  }
}

/**
 * Log info message
 * @param {string} message - Log message
 */
function logInfo(message) {
  console.log(`[INFO] ${message}`);
}

/**
 * Extract Oura ID from event description
 * @param {string} description - Event description
 * @returns {string|null} Oura ID or null if not found
 */
function extractOuraIdFromDescription(description) {
  if (!description) return null;
  const match = description.match(/\[oura_id:([^\]]+)\]/);
  return match ? match[1] : null;
}

/**
 * Append Oura ID to description
 * @param {string} description - Original description
 * @param {string} ouraId - Oura ID
 * @returns {string} Description with Oura ID appended
 */
function appendOuraIdToDescription(description, ouraId) {
  return `${description}\n\n[oura_id:${ouraId}]`;
}
