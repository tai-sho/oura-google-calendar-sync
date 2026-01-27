# oura-google-calendar-sync

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Sync Oura Ring data to Google Calendar using Google Apps Script.

## Features

- **Sleep data** - Duration, start/end time, sleep stages, vitals, scores
- **Workout data** - Activity type, duration, calories, distance
- **Daily scores** - Readiness, Sleep Score, Stress, Activity, SpO2 (combined in one all-day event)

## Calendar Event Examples

### Sleep Event
- **Title**: `Sleep 7h 30m (85)`
- **Time**: 23:30 - 07:00
- **Color**: Blue

### Workout Event
- **Title**: `Running - 450 kcal`
- **Time**: 18:00 - 19:00
- **Color**: Orange

### Daily Scores Event (All-day)
- **Title**: `Oura: R:82 | S:85 | St:restored`
- **Color**: Green

## Setup

### Prerequisites

- Node.js (v18+)
- Google Account
- Oura Ring with API access (Gen3 or Ring 4)
- Active Oura membership

### Installation

1. Clone this repository

```bash
git clone https://github.com/tai-sho/oura-google-calendar-sync.git
cd oura-google-calendar-sync
npm install
```

2. Login to clasp

```bash
npx clasp login
```

3. Create a new GAS project

```bash
npx clasp create --title "oura-google-calendar-sync" --type standalone
```

Or use existing project:
```bash
cp .clasp.json.example .clasp.json
# Edit .clasp.json and set your scriptId
```

4. Push to GAS

```bash
npm run push
```

### Create Oura OAuth Application

1. Go to [Oura Developer Portal](https://developer.ouraring.com/applications)
2. Click "New Application"
3. Fill in the form:
   - **App Name**: Any name (e.g., "My Calendar Sync")
   - **Redirect URI**: `https://script.google.com/macros/d/{SCRIPT_ID}/usercallback`
     - Replace `{SCRIPT_ID}` with your GAS script ID (found in `.clasp.json`)
4. Copy the **Client ID** and **Client Secret**

### Configure Script Properties

In GAS editor: **Project Settings** > **Script Properties**

| Property | Required | Description |
|----------|----------|-------------|
| `OURA_CLIENT_ID` | Yes | Your Oura OAuth Client ID |
| `OURA_CLIENT_SECRET` | Yes | Your Oura OAuth Client Secret |
| `CALENDAR_ID` | Yes | Target Google Calendar ID |
| `SYNC_DAYS` | No | Number of days to sync (default: 7) |

### Get Calendar ID

- For primary calendar: Use your Google account email address
- For other calendars: Open Google Calendar > Calendar Settings > Calendar ID

### Authorize Oura

1. In GAS editor, run `authorizeOura()`
2. Check the execution log for the authorization URL
3. Open the URL in your browser
4. Log in to Oura and click "Allow"
5. You should see "Authorization successful!"

## Usage

### Manual Sync

In GAS editor, run any of these functions:

- `syncOuraToCalendar()` - Sync all data (sleep, workouts, daily scores)
- `syncSleep()` - Sync only sleep data
- `syncWorkouts()` - Sync only workout data
- `syncDailyScores()` - Sync only daily scores

### Test Connection

- `testOuraConnection()` - Verify Oura OAuth is working
- `testCalendarConnection()` - Verify Calendar ID is correct
- `checkOuraAuth()` - Check authorization status

### OAuth Management

- `authorizeOura()` - Start authorization flow
- `logoutOura()` - Reset authorization (re-authorize required)

### Setup Automatic Sync

Run `setupDailyTrigger()` to set up automatic daily sync at 8:00 AM.

To remove the trigger, run `removeTriggers()`.

### npm Scripts

```bash
npm run push   # Push local files to GAS
npm run pull   # Pull from GAS to local
npm run watch  # Watch and auto-push changes
npm run open   # Open GAS editor in browser
npm run logs   # View execution logs
```

## File Structure

```
src/
├── appsscript.json      # GAS manifest
├── main.gs              # Entry points, OAuth, and triggers
├── config.gs            # Configuration management
├── ouraApi.gs           # Oura API client
├── calendarService.gs   # Google Calendar operations
├── syncService.gs       # Sync logic
├── formatters.gs        # Event formatting
└── utils.gs             # Utility functions
```

## Troubleshooting

### "OURA_CLIENT_ID is not set"
Set the `OURA_CLIENT_ID` and `OURA_CLIENT_SECRET` in Script Properties.

### "Not authorized. Run authorizeOura() first."
Run `authorizeOura()` and complete the authorization flow.

### "Calendar not found"
Check that the `CALENDAR_ID` is correct. For primary calendar, use your email address.

### "Oura API authentication failed"
Your OAuth token may have expired. Run `logoutOura()` then `authorizeOura()` to re-authorize.

### SpO2 data not showing
SpO2 data requires an active Oura membership and may not be available for all users.

## License

MIT
