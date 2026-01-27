/**
 * Oura API Client for Google Apps Script
 */

/**
 * OuraApiClient class for interacting with Oura Ring API v2
 */
class OuraApiClient {
  /**
   * @param {string} accessToken - Oura Personal Access Token
   * @param {string} baseUrl - API base URL
   */
  constructor(accessToken, baseUrl) {
    this.accessToken = accessToken;
    this.baseUrl = baseUrl || DEFAULTS.OURA_API_BASE_URL;
  }

  /**
   * Get sleep periods data
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Sleep data array
   */
  getSleep(startDate, endDate) {
    return this._fetch('v2/usercollection/sleep', { start_date: startDate, end_date: endDate });
  }

  /**
   * Get daily sleep scores
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Daily sleep data array
   */
  getDailySleep(startDate, endDate) {
    return this._fetch('v2/usercollection/daily_sleep', { start_date: startDate, end_date: endDate });
  }

  /**
   * Get workout data
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Workout data array
   */
  getWorkouts(startDate, endDate) {
    return this._fetch('v2/usercollection/workout', { start_date: startDate, end_date: endDate });
  }

  /**
   * Get daily readiness scores
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Daily readiness data array
   */
  getDailyReadiness(startDate, endDate) {
    return this._fetch('v2/usercollection/daily_readiness', { start_date: startDate, end_date: endDate });
  }

  /**
   * Get daily stress data
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Daily stress data array
   */
  getDailyStress(startDate, endDate) {
    return this._fetch('v2/usercollection/daily_stress', { start_date: startDate, end_date: endDate });
  }

  /**
   * Internal fetch method
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Array} Response data array
   * @private
   */
  _fetch(endpoint, params) {
    const url = this._buildUrl(endpoint, params);
    const options = {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode === 401) {
      throw new Error('Oura API authentication failed. Please check your access token.');
    }

    if (statusCode === 429) {
      throw new Error('Oura API rate limit exceeded. Please try again later.');
    }

    if (statusCode !== 200) {
      throw new Error(`Oura API error: ${statusCode} - ${responseText}`);
    }

    const responseJson = JSON.parse(responseText);
    return responseJson.data || [];
  }

  /**
   * Build URL with query parameters
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {string} Full URL
   * @private
   */
  _buildUrl(endpoint, params) {
    const url = `${this.baseUrl}/${endpoint}`;
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return queryString ? `${url}?${queryString}` : url;
  }
}
