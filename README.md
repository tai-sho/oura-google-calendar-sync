# oura-google-calendar-sync

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Sync Oura Ring data to Google Calendar using Google Apps Script.

## Features

- **Sleep data** - Duration, start/end time, sleep stages, vitals, scores
- **Workout data** - Activity type, duration, calories, distance
- **Daily scores** - Readiness, Sleep Score, Stress, Activity, SpO2, Sleep Time Recommendation (combined in one all-day event)
- **Rest Mode** - Multi-day all-day event when Rest Mode is enabled (shown until today while it is still on)
- **Real-time sync (optional)** - Oura webhooks update the calendar within minutes via [oura-google-calendar-sync-webhook](https://github.com/tai-sho/oura-google-calendar-sync-webhook)

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

### Rest Mode Event (Multi-day All-day)
- **Title**: `Rest Mode`
- **Duration**: Start day to end day
- **Color**: Purple (Grape)

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
| `WEBHOOK_SHARED_SECRET` | Webhook only | Shared secret with the webhook relay (see [Webhook](#webhook-real-time-sync)) |

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

- `syncOuraToCalendar()` - Sync all data (sleep, workouts, daily scores, rest mode)
- `syncSleep()` - Sync only sleep data
- `syncWorkouts()` - Sync only workout data
- `syncDailyScores()` - Sync only daily scores
- `syncRestMode()` - Sync only rest mode periods
- `testProcessWebhookEvents()` - Run the webhook sync path for today's sleep and readiness

Syncs hold a script lock, so manual runs, the daily trigger and webhook syncs never write the same events at the same time. Events whose title, description and time are unchanged are skipped.

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

Keep the daily trigger even when using webhooks: it re-syncs the last `SYNC_DAYS` days and catches anything a webhook missed. If a webhook sync is running at that moment, the daily run waits up to 2 minutes and is otherwise skipped.

### Webhook (real-time sync)

Apps Script cannot verify Oura's webhook signatures (no access to HTTP headers), so webhooks are received by a small relay, [oura-google-calendar-sync-webhook](https://github.com/tai-sho/oura-google-calendar-sync-webhook), running on a PHP server. The relay forwards verified events here in batches, and this project re-syncs only the affected data types and dates.

```
Oura -> relay (verify, queue) -> cron every 5 min -> doPost (this project) -> Google Calendar
```

1. Generate a secret and save it as the Script Property `WEBHOOK_SHARED_SECRET`

```bash
openssl rand -hex 32
```

2. Deploy the web app (first time)

```bash
npm run push
npx clasp deploy --description "webhook"
```

   The manifest deploys it as **Execute as: Me** / **Who has access: Anyone**. Note the deployment ID; the web app URL is `https://script.google.com/macros/s/<deploymentId>/exec`.

3. Configure the relay with that URL and secret (`GAS_WEBAPP_URL`, `GAS_SHARED_SECRET`) and follow its README to subscribe to Oura webhooks.

4. Updating the code later: `npm run push` alone does **not** update the web app. Redeploy the same deployment so the URL stays the same:

```bash
npm run push
npx clasp redeploy <deploymentId> --description "webhook"
```

What a webhook event syncs:

| Oura data_type | Sync | Dates |
|---|---|---|
| `sleep` | Sleep | Event date -2 to +1 day |
| `daily_sleep` | Sleep and daily scores | Event date -2 to +1 day |
| `daily_readiness`, `daily_activity`, `daily_stress`, `daily_spo2`, `sleep_time` | Daily scores | Event date -2 to +1 day |
| `workout` | Workouts | Event date -2 to +1 day |
| `rest_mode_period` | Rest mode | Last 60 days |

`delete` events are only logged for now.

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
├── webhook.gs           # Web app entry point for the webhook relay (doPost)
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

### "Another sync is running. Skipped this run."
The daily trigger found a webhook sync (or a manual run) holding the script lock for more than 2 minutes. The next webhook or daily run catches up.

### Webhook relay reports "GAS rejected the shared secret"
`WEBHOOK_SHARED_SECRET` in Script Properties differs from `GAS_SHARED_SECRET` on the relay.

### Webhook relay reports a non-JSON response
The web app is not deployed (or not as "Anyone"), or the code was pushed without redeploying. Redeploy the existing deployment with `npx clasp redeploy <deploymentId>`.

## License

MIT
