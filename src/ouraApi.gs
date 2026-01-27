/**
 * Oura API Client for Google Apps Script
 */

/**
 * OuraApiClient class for interacting with Oura Ring API v2
 */
class OuraApiClient {
  /**
   * @param {OAuth2.Service} oauthService - OAuth2 service for Oura
   * @param {string} baseUrl - API base URL
   */
  constructor(oauthService, baseUrl) {
    this.oauthService = oauthService;
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
   * Get daily activity data
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Daily activity data array
   */
  getDailyActivity(startDate, endDate) {
    return this._fetch('v2/usercollection/daily_activity', { start_date: startDate, end_date: endDate });
  }

  /**
   * Get daily SpO2 data
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Daily SpO2 data array
   */
  getDailySpo2(startDate, endDate) {
    return this._fetch('v2/usercollection/daily_spo2', { start_date: startDate, end_date: endDate });
  }

  /**
   * Get sleep time recommendations
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Sleep time data array
   */
  getSleepTime(startDate, endDate) {
    return this._fetch('v2/usercollection/sleep_time', { start_date: startDate, end_date: endDate });
  }

  /**
   * Get rest mode periods
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array} Rest mode period data array
   */
  getRestModePeriods(startDate, endDate) {
    return this._fetch('v2/usercollection/rest_mode_period', { start_date: startDate, end_date: endDate });
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
    const accessToken = this.oauthService.getAccessToken();

    const options = {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode === 401) {
      // 401 can mean either auth failed OR endpoint requires subscription/unavailable feature
      throw new Error('Oura API: Unauthorized (401) - endpoint may require subscription or re-authorization');
    }

    if (statusCode === 429) {
      throw new Error('Oura API rate limit exceeded. Please try again later.');
    }

    if (statusCode === 403) {
      // 403 typically means the feature is not available for this user
      throw new Error('Oura API: Forbidden (403) - feature may require Oura membership');
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
