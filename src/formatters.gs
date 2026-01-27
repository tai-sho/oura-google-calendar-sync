/**
 * Event formatters for Oura data
 */

/**
 * Format sleep event data
 * @param {Object} sleep - Sleep period data from Oura API
 * @param {Object} dailySleep - Daily sleep score data (optional)
 * @returns {Object} Formatted event {title, description}
 */
function formatSleepEvent(sleep, dailySleep) {
  const duration = formatDuration(sleep.total_sleep_duration);
  const scoreText = dailySleep && dailySleep.score ? ` (${dailySleep.score})` : '';

  const title = `Sleep ${duration}${scoreText}`;

  const descriptionParts = [
    '=== Sleep Summary ===',
    `Total Sleep: ${duration}`,
    `Time in Bed: ${formatDuration(sleep.time_in_bed)}`,
    `Efficiency: ${sleep.efficiency || 'N/A'}%`,
    '',
    '=== Sleep Stages ===',
    `Deep Sleep: ${formatDuration(sleep.deep_sleep_duration)}`,
    `REM Sleep: ${formatDuration(sleep.rem_sleep_duration)}`,
    `Light Sleep: ${formatDuration(sleep.light_sleep_duration)}`,
    `Awake: ${formatDuration(sleep.awake_time)}`
  ];

  if (sleep.average_heart_rate || sleep.average_hrv || sleep.lowest_heart_rate) {
    descriptionParts.push('');
    descriptionParts.push('=== Vitals ===');
    if (sleep.average_heart_rate) {
      descriptionParts.push(`Avg Heart Rate: ${sleep.average_heart_rate} bpm`);
    }
    if (sleep.lowest_heart_rate) {
      descriptionParts.push(`Lowest HR: ${sleep.lowest_heart_rate} bpm`);
    }
    if (sleep.average_hrv) {
      descriptionParts.push(`Avg HRV: ${sleep.average_hrv} ms`);
    }
    if (sleep.average_breath) {
      descriptionParts.push(`Avg Breath: ${sleep.average_breath} /min`);
    }
  }

  if (dailySleep && dailySleep.score) {
    descriptionParts.push('');
    descriptionParts.push(`=== Sleep Score: ${dailySleep.score} ===`);
    if (dailySleep.contributors) {
      const c = dailySleep.contributors;
      if (c.deep_sleep !== null) descriptionParts.push(`Deep Sleep: ${c.deep_sleep}`);
      if (c.rem_sleep !== null) descriptionParts.push(`REM Sleep: ${c.rem_sleep}`);
      if (c.efficiency !== null) descriptionParts.push(`Efficiency: ${c.efficiency}`);
      if (c.restfulness !== null) descriptionParts.push(`Restfulness: ${c.restfulness}`);
      if (c.latency !== null) descriptionParts.push(`Latency: ${c.latency}`);
      if (c.timing !== null) descriptionParts.push(`Timing: ${c.timing}`);
      if (c.total_sleep !== null) descriptionParts.push(`Total Sleep: ${c.total_sleep}`);
    }
  }

  return {
    title: title,
    description: descriptionParts.join('\n')
  };
}

/**
 * Format workout event data
 * @param {Object} workout - Workout data from Oura API
 * @returns {Object} Formatted event {title, description}
 */
function formatWorkoutEvent(workout) {
  const activity = workout.activity || 'Workout';
  const calories = workout.calories ? `${workout.calories} kcal` : '';

  const titleParts = [activity];
  if (calories) titleParts.push(calories);

  const title = titleParts.join(' - ');

  const descriptionParts = [
    '=== Workout Details ===',
    `Activity: ${activity}`,
    `Intensity: ${workout.intensity || 'N/A'}`
  ];

  if (workout.calories) {
    descriptionParts.push(`Calories: ${workout.calories} kcal`);
  }

  if (workout.distance) {
    descriptionParts.push(`Distance: ${(workout.distance / 1000).toFixed(2)} km`);
  }

  if (workout.source) {
    descriptionParts.push(`Source: ${workout.source}`);
  }

  if (workout.label) {
    descriptionParts.push(`Label: ${workout.label}`);
  }

  return {
    title: title,
    description: descriptionParts.join('\n')
  };
}

/**
 * Format daily scores event data
 * @param {Object} readiness - Daily readiness data (optional)
 * @param {Object} stress - Daily stress data (optional)
 * @param {Object} dailySleep - Daily sleep data (optional)
 * @returns {Object} Formatted event {title, description}
 */
function formatDailyScoreEvent(readiness, stress, dailySleep) {
  const scores = [];

  if (readiness && readiness.score) scores.push(`R:${readiness.score}`);
  if (dailySleep && dailySleep.score) scores.push(`S:${dailySleep.score}`);
  if (stress && stress.day_summary) scores.push(`St:${stress.day_summary}`);

  const title = scores.length > 0
    ? `Oura: ${scores.join(' | ')}`
    : 'Oura: No scores';

  const descriptionParts = ['=== Daily Scores ==='];

  if (readiness && readiness.score) {
    descriptionParts.push('');
    descriptionParts.push(`--- Readiness: ${readiness.score} ---`);
    if (readiness.contributors) {
      const c = readiness.contributors;
      if (c.activity_balance !== null) descriptionParts.push(`Activity Balance: ${c.activity_balance}`);
      if (c.body_temperature !== null) descriptionParts.push(`Body Temperature: ${c.body_temperature}`);
      if (c.hrv_balance !== null) descriptionParts.push(`HRV Balance: ${c.hrv_balance}`);
      if (c.previous_day_activity !== null) descriptionParts.push(`Previous Day Activity: ${c.previous_day_activity}`);
      if (c.previous_night !== null) descriptionParts.push(`Previous Night: ${c.previous_night}`);
      if (c.recovery_index !== null) descriptionParts.push(`Recovery Index: ${c.recovery_index}`);
      if (c.resting_heart_rate !== null) descriptionParts.push(`Resting Heart Rate: ${c.resting_heart_rate}`);
      if (c.sleep_balance !== null) descriptionParts.push(`Sleep Balance: ${c.sleep_balance}`);
    }
    if (readiness.temperature_deviation !== undefined) {
      descriptionParts.push(`Temperature Deviation: ${readiness.temperature_deviation}`);
    }
  }

  if (dailySleep && dailySleep.score) {
    descriptionParts.push('');
    descriptionParts.push(`--- Sleep Score: ${dailySleep.score} ---`);
  }

  if (stress) {
    descriptionParts.push('');
    descriptionParts.push('--- Stress ---');
    if (stress.day_summary) descriptionParts.push(`Day Summary: ${stress.day_summary}`);
    if (stress.stress_high !== undefined) descriptionParts.push(`Stress High: ${stress.stress_high}`);
    if (stress.recovery_high !== undefined) descriptionParts.push(`Recovery High: ${stress.recovery_high}`);
  }

  return {
    title: title,
    description: descriptionParts.join('\n')
  };
}
