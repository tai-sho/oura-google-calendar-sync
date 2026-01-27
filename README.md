# oura-google-calendar-sync

Sync Oura Ring data to Google Calendar using Google Apps Script.

## Features

- Sleep data (duration, start/end time, scores)
- Workout data
- Daily scores (readiness, activity)
- Stress data

## Setup

### Prerequisites

- Node.js (v18+)
- Google Account
- Oura Ring with API access

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

3. Create a new GAS project or use existing one

```bash
# Create new project
npx clasp create --title "oura-google-calendar-sync" --type standalone

# Or copy .clasp.json.example and set your scriptId
cp .clasp.json.example .clasp.json
```

4. Push to GAS

```bash
npm run push
```

5. Configure script properties in GAS editor
   - `OURA_ACCESS_TOKEN`: Your Oura personal access token
   - `CALENDAR_ID`: Target Google Calendar ID

### Get Oura Access Token

1. Go to [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)
2. Create a new personal access token
3. Copy the token

## Usage

### npm scripts

```bash
npm run push   # Push local files to GAS
npm run pull   # Pull from GAS to local
npm run watch  # Watch and auto-push changes
npm run open   # Open GAS editor in browser
npm run logs   # View execution logs
```

## License

MIT
