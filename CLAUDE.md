# CLAUDE.md

## Project Overview

Google Apps Script (GAS) that fetches data from Oura Ring API v2 and syncs it to Google Calendar.

## Tech Stack

- Google Apps Script (GAS)
- clasp - Local development tool for GAS
- OAuth2 for Apps Script library (v43)

## Development Workflow

```bash
npm run push   # Deploy local → GAS
npm run pull   # Pull GAS → local
npm run watch  # Watch and auto-push changes
```

Testing is done by manually running functions in the GAS editor.

## File Structure

| File | Purpose |
|------|---------|
| main.gs | Entry point, OAuth2 auth functions, trigger setup |
| config.gs | Configuration management, constants |
| ouraApi.gs | Oura API client |
| calendarService.gs | Google Calendar operations, duplicate detection |
| syncService.gs | Sync logic |
| formatters.gs | Event title and description formatting |
| utils.gs | Common utilities |

## Important Notes

### OAuth2 Library Version

**Always use version 43.**

```json
{
  "userSymbol": "OAuth2",
  "libraryId": "1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF",
  "version": "43"
}
```

Newer versions like 46 will cause `NOT_FOUND` errors.

### Oura API Authentication Changes

- **Personal Access Token (PAT) is deprecated as of December 2025**
- Use OAuth2 authentication
- Oura Developer Portal has changed: https://developer.ouraring.com/applications
  - Old URL `https://cloud.ouraring.com/oauth/applications` is no longer valid

### SpO2 Data

- Could not be retrieved with PAT (401 error)
- With OAuth2, can be retrieved by including the `spo2` scope
- However, may not be available depending on user's subscription or ring model

## Oura API v2

Documentation: https://cloud.ouraring.com/v2/docs

### Endpoints

| Data | Endpoint |
|------|----------|
| Sleep Details | `v2/usercollection/sleep` |
| Daily Sleep Score | `v2/usercollection/daily_sleep` |
| Workout | `v2/usercollection/workout` |
| Daily Readiness | `v2/usercollection/daily_readiness` |
| Daily Stress | `v2/usercollection/daily_stress` |
| Daily Activity | `v2/usercollection/daily_activity` |
| Daily SpO2 | `v2/usercollection/daily_spo2` |
| Sleep Time Recommendation | `v2/usercollection/sleep_time` |
| Rest Mode | `v2/usercollection/rest_mode_period` |

### Oura Membership Required Endpoints (401 Error)

The following endpoints require an Oura membership (paid subscription):

- `v2/usercollection/daily_cardiovascular_age` - Cardiovascular Age
- `v2/usercollection/vO2_max` - VO2 Max
- `v2/usercollection/daily_resilience` - Resilience

## OAuth2 Scopes

All 8 scopes: `email personal daily heartrate workout tag session spo2`

## Script Properties

| Key | Required | Description |
|-----|----------|-------------|
| OURA_CLIENT_ID | Yes | OAuth Client ID |
| OURA_CLIENT_SECRET | Yes | OAuth Client Secret |
| CALENDAR_ID | Yes | Target Google Calendar ID |
| SYNC_DAYS | No | Number of days to sync (default: 7) |

## Modification Guidelines

When adding features or making changes, always update **README.md** as well.

Sections that may need updates:
- Features section (feature list)
- Calendar Event Examples section (event examples)
- Manual Sync section (available functions)
- Troubleshooting section (if applicable)
