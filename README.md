# oura-google-calendar-sync

Sync Oura Ring data to Google Calendar using Google Apps Script.

## Features

- **Sleep data** - Duration, start/end time, sleep stages, vitals, scores
- **Workout data** - Activity type, duration, calories, distance
- **Daily scores** - Readiness, Sleep Score, Stress (combined in one all-day event)

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

5. Open GAS editor and configure Script Properties

```bash
npm run open
```

### Configure Script Properties

In GAS editor: **Project Settings** > **Script Properties**

| Property | Required | Description |
|----------|----------|-------------|
| `OURA_ACCESS_TOKEN` | Yes | Your Oura personal access token |
| `CALENDAR_ID` | Yes | Target Google Calendar ID |
| `SYNC_DAYS` | No | Number of days to sync (default: 7) |

### Get Oura Access Token

1. Go to [Oura Cloud Personal Access Tokens](https://cloud.ouraring.com/personal-access-tokens)
2. Create a new personal access token
3. Copy the token and save it to Script Properties

### Get Calendar ID

- For primary calendar: Use your email address (e.g., `your.email@gmail.com`)
- For other calendars: Open Google Calendar > Calendar Settings > Calendar ID

## Usage

### Manual Sync

In GAS editor, run any of these functions:

- `syncOuraToCalendar()` - Sync all data (sleep, workouts, daily scores)
- `syncSleep()` - Sync only sleep data
- `syncWorkouts()` - Sync only workout data
- `syncDailyScores()` - Sync only daily scores

### Test Connection

- `testOuraConnection()` - Verify Oura API token is working
- `testCalendarConnection()` - Verify Calendar ID is correct

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
├── main.gs              # Entry points and triggers
├── config.gs            # Configuration management
├── ouraApi.gs           # Oura API client
├── calendarService.gs   # Google Calendar operations
├── syncService.gs       # Sync logic
├── formatters.gs        # Event formatting
└── utils.gs             # Utility functions
```

## Troubleshooting

### "OURA_ACCESS_TOKEN is not set"
Set the `OURA_ACCESS_TOKEN` in Script Properties.

### "Calendar not found"
Check that the `CALENDAR_ID` is correct. For primary calendar, use your email address.

### "Oura API authentication failed"
Your access token may be invalid or expired. Create a new token at Oura Cloud.

## License

MIT
