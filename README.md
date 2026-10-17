# Cursor Usage Analyzer

![Cursor Usage Banner](banner.png)

A CLI tool for analyzing Cursor API usage and membership information, inspired by [ccusage](https://github.com/ryoppippi/ccusage).

## Features

- 📊 Extract Cursor credentials from local database (or `--token` / env)
- 🔄 Fetch usage data from Cursor API
- 🤖 Grok Bot weekly usage (Cursor “Sand” dashboard endpoint)
- 📋 Display membership and plan usage information
- 📈 Daily, weekly, and monthly usage reports
- 💰 Token count and cost tracking
- 🎨 Beautiful Unicode tables with colored output (inspired by [ccusage](https://github.com/ryoppippi/ccusage))
- 📦 JSON output for programmatic use

## Installation

Install the package globally using npm:

```bash
npm install -g cursor-usage
```

Or use it directly without installation:

```bash
npx cursor-usage@latest
```

## Quick Test

You can test the package without installing it locally using npx or bunx:

```bash
# Test with npx (Node.js)
npx cursor-usage@latest

# Test with bunx (Bun runtime)
bunx cursor-usage@latest

# Test specific commands
npx cursor-usage@latest daily
npx cursor-usage@latest monthly

# Test with flags
npx cursor-usage@latest daily --breakdown
npx cursor-usage@latest weekly --json
```


## Grok Bot weekly usage

Default `cursor-usage` (summary) now also prints a **Grok Bot weekly** section when available.

```bash
cursor-usage              # IDE summary + Grok Bot weekly
cursor-usage grok         # Grok Bot weekly only (alias: sand)
cursor-usage grok --json
```

This uses Cursor’s undocumented dashboard endpoint `POST /api/dashboard/get-sand-usage-status`
(internal product name: **Sand**), with a Connect-RPC fallback on `api2.cursor.sh`.
The endpoint is not part of a public API and **may change or break without notice**.

Auth is the same WorkOS session cookie the rest of this tool already uses. Pass a token if the
local Cursor IDE session is missing or expired:

```bash
export CURSOR_SESSION_TOKEN='userId::your_jwt'   # or URL-encoded cookie value
# or
export CURSOR_ACCESS_TOKEN='your_jwt'            # user id taken from JWT sub
cursor-usage grok --token "$CURSOR_SESSION_TOKEN"
```

This package **does not** read Grok Bot app files (`sand-secrets.json`) or the macOS Keychain.

## Usage

### Commands

```bash
# Show current billing summary (default)
npm run dev

# Show daily usage for last 7 days (default)
npm run dev -- daily

# Show daily usage for last N days
npm run dev -- daily 30
npm run dev -- d 7          # Alias

# Show monthly usage for last 3 months (default)
npm run dev -- monthly

# Show monthly usage for last N months
npm run dev -- monthly 6
npm run dev -- m 12         # Alias

# Show detailed usage for today
npm run dev -- today

# Show help
npm run dev -- help

# Show usage with date range
npm run dev -- daily --since 2026-01-01 --until 2026-01-15

# Show usage with model breakdown
npm run dev -- daily --breakdown

# Show compact table format
npm run dev -- monthly --compact

# Output as JSON (detailed reports only)
npm run dev -- daily --json
```

### Flags

- `--since DATE` - Start date (YYYY-MM-DD)
- `--until DATE` - End date (YYYY-MM-DD)
- `--breakdown` - Show per-model breakdown
- `--json` - Output as JSON (machine-readable format)
- `--compact` - Compact table format

### Development

```bash
npm run dev              # Run with tsx (default summary)
npm start               # Run with tsx (default summary)
npm run build           # Compile TypeScript
```

## Example Output

### Summary View

```bash
cursor-usage
```

```
╭────────────────────────────────────────╮
│         Cursor Usage Summary           │
╰────────────────────────────────────────╯

📋 ACCOUNT INFORMATION
  Membership:     pro
  Billing Cycle:  Dec 29, 2025 to Jan 29, 2026

📊 PLAN USAGE
  Used:      150 / 2000 (7.50%)
  Remaining: 1850
  Breakdown:
    - Included: 150
    - Bonus:    0
    - Total:    150
```

### Daily Report View

```bash
cursor-usage daily
```

```
╭──────────────────────────────────────────────╮
│  Cursor Usage Report - Daily (Last 7 days)   │
╰──────────────────────────────────────────────╯

┌────────────┬────────┬──────────────┬───────┬────────┬───────┬──────────────────────────────────┐
│ Date       │ Events │ Total Tokens │ Input │ Output │  Cost │ Models                           │
├────────────┼────────┼──────────────┼───────┼────────┼───────┼──────────────────────────────────┤
│ 2026-01-11 │      3 │      539,301 │   381 │  7,081 │ $0.82 │ claude-4.5-opus-high-thinking(3) │
├────────────┼────────┼──────────────┼───────┼────────┼───────┼──────────────────────────────────┤
│ Total      │      3 │      539,301 │   381 │  7,081 │ $0.82 │                                  │
└────────────┴────────┴──────────────┴───────┴────────┴───────┴──────────────────────────────────┘
```

### Monthly Report View

```bash
cursor-usage monthly
```

```
╭────────────────────────────────────────────────────╮
│  Cursor Usage Report - Monthly (Last 3 months)     │
╰────────────────────────────────────────────────────╯

┌──────────┬────────┬───────────────┬─────────┬─────────┬────────┬─────────────────────┐
│ Month    │ Events │ Total Tokens  │   Input │  Output │   Cost │ Models              │
├──────────┼────────┼───────────────┼─────────┼─────────┼────────┼─────────────────────┤
│ 2026-01  │     50 │     5,000,000 │  50,000 │  30,000 │  $4.50 │ claude-sonnet(50)   │
├──────────┼────────┼───────────────┼─────────┼─────────┼────────┼─────────────────────┤
│ 2025-12  │     75 │     8,500,000 │  75,000 │  45,000 │  $6.80 │ claude-opus(75)     │
├──────────┼────────┼───────────────┼─────────┼─────────┼────────┼─────────────────────┤
│ 2025-11  │     25 │     2,500,000 │  20,000 │  10,000 │  $2.00 │ claude-haiku(25)    │
├──────────┼────────┼───────────────┼─────────┼─────────┼────────┼─────────────────────┤
│ Total    │    150 │    16,000,000 │ 145,000 │  85,000 │ $13.30 │                     │
└──────────┴────────┴───────────────┴─────────┴─────────┴────────┴─────────────────────┘
```

### Detailed Event View

```bash
cursor-usage today
```

```
╭─────────────────────────────────────────╮
│  Cursor Usage Report - Sun Jan 11 2026  │
╰─────────────────────────────────────────╯

┌──────────┬───────────────┬───────┬──────────────┬───────────────┬──────────────┬─────────┐
│ Time     │ Model         │ Type  │ Input Tokens │ Output Tokens │ Total Tokens │    Cost │
├──────────┼───────────────┼───────┼──────────────┼───────────────┼──────────────┼─────────┤
│ 2:15 pm  │ claude-opus   │ usage │          500 │         1,200 │        1,700 │ $0.0850 │
├──────────┼───────────────┼───────┼──────────────┼───────────────┼──────────────┼─────────┤
│ 1:45 pm  │ claude-sonnet │ usage │          300 │           800 │        1,100 │ $0.0440 │
├──────────┼───────────────┼───────┼──────────────┼───────────────┼──────────────┼─────────┤
│ 1:20 pm  │ claude-haiku  │ usage │          100 │           250 │          350 │ $0.0070 │
├──────────┼───────────────┼───────┼──────────────┼───────────────┼──────────────┼─────────┤
│ Total    │               │       │          900 │         2,250 │        3,150 │  $0.14  │
└──────────┴───────────────┴───────┴──────────────┴───────────────┴──────────────┴─────────┘
```

### Model Breakdown View (`--breakdown`)

When using `--breakdown`, reports include a detailed per-model breakdown:

```bash
cursor-usage daily --breakdown
```

```
╭────────────────────────────────────────╮
│          PER-MODEL BREAKDOWN           │
╰────────────────────────────────────────╯

┌───────────────┬────────┬──────────────┬─────────┬─────────┬───────┬─────────┬────────┐
│ Model         │ Events │ Total Tokens │   Input │  Output │  Cost │ Token % │ Cost % │
├───────────────┼────────┼──────────────┼─────────┼─────────┼───────┼─────────┼────────┤
│ claude-opus   │     15 │    2,500,000 │  20,000 │  15,000 │ $2.00 │  50.00% │ 40.00% │
├───────────────┼────────┼──────────────┼─────────┼─────────┼───────┼─────────┼────────┤
│ claude-sonnet │     10 │    2,000,000 │  15,000 │  12,000 │ $1.60 │  40.00% │ 32.00% │
├───────────────┼────────┼──────────────┼─────────┼─────────┼───────┼─────────┼────────┤
│ claude-haiku  │      5 │      500,000 │   5,000 │   3,000 │ $0.40 │  10.00% │  8.00% │
└───────────────┴────────┴──────────────┴─────────┴─────────┴───────┴─────────┴────────┘
```

### JSON Output (`--json`)

JSON output provides clean, structured data for programmatic use (no table formatting):

```bash
cursor-usage daily --json
```

```json
{
  "command": "daily",
  "generatedAt": "2026-01-11T10:30:00.000Z",
  "period": "last 7 days",
  "summary": {
    "totalEvents": 45,
    "totalTokens": 539301,
    "totalCost": 0.82
  },
  "data": [
    {
      "date": "2026-01-11",
      "eventCount": 3,
      "totalTokens": 539301,
      "inputTokens": 381,
      "outputTokens": 7081,
      "totalCost": 0.82,
      "models": {
        "claude-4.5-opus-high-thinking": 3
      }
    }
  ],
  "breakdown": [
    {
      "model": "claude-opus",
      "count": 15,
      "totalTokens": 250000,
      "inputTokens": 20000,
      "outputTokens": 15000,
      "totalCost": 2.0,
      "tokenPercent": 50.0,
      "costPercent": 40.0
    }
  ]
}
```

### Weekly Report View

```bash
cursor-usage weekly
```

```
╭─────────────────────────────────────────────────╮
│  Cursor Usage Report - Weekly (Last 4 weeks)    │
╰─────────────────────────────────────────────────╯

┌─────────────────────────┬────────┬──────────────┬─────────┬─────────┬────────┬─────────────────────┐
│ Week                    │ Events │ Total Tokens │   Input │  Output │   Cost │ Models              │
├─────────────────────────┼────────┼──────────────┼─────────┼─────────┼────────┼─────────────────────┤
│ 2026-01-06 - 2026-01-12 │     25 │    3,500,000 │  35,000 │  21,000 │  $3.50 │ claude-opus(25)     │
├─────────────────────────┼────────┼──────────────┼─────────┼─────────┼────────┼─────────────────────┤
│ 2025-12-30 - 2026-01-05 │     40 │    5,200,000 │  52,000 │  31,200 │  $5.20 │ claude-sonnet(40)   │
├─────────────────────────┼────────┼──────────────┼─────────┼─────────┼────────┼─────────────────────┤
│ Total                   │     65 │    8,700,000 │  87,000 │  52,200 │  $8.70 │                     │
└─────────────────────────┴────────┴──────────────┴─────────┴─────────┴────────┴─────────────────────┘
```

## Environment Variables

- `CURSOR_SESSION_TOKEN` - Full session (`userId::jwt` or URL-encoded `WorkosCursorSessionToken` value)
- `CURSOR_ACCESS_TOKEN` - Access JWT only (user id from JWT `sub` claim)
- `CURSOR_DATA_DIR` - Custom path to Cursor data directory (optional)
- `DEBUG` - Enable debug logging

CLI flag `--token` accepts the same shapes as `CURSOR_SESSION_TOKEN`.

## Project Structure

```
src/
├── index.ts          # CLI entry point
├── cli.ts            # Command routing
├── auth.ts           # Credential resolution (db / env / --token)
├── data-loader.ts    # IDE database + usage-summary fetch
├── sand-usage.ts     # Grok Bot (Sand) weekly usage
├── event-loader.ts   # Detailed usage events
├── commands.ts       # Daily / weekly / monthly reports
├── logger.ts         # Colored logging utilities
├── _types.ts         # TypeScript type definitions
└── _consts.ts        # Constants & configuration
```

## Features Implemented

- ✅ Grok Bot weekly usage (`grok` / default summary)
- ✅ Daily, weekly, and monthly usage reports
- ✅ Detailed event breakdown by time
- ✅ Token count tracking (input, output, cache)
- ✅ Cost calculation and display
- ✅ Model usage breakdown with `--breakdown` flag
- ✅ Flexible date range querying with `--since` and `--until`
- ✅ Beautiful Unicode tables with box-drawing characters
- ✅ Colorized CLI output (cyan headers, yellow totals)
- ✅ JSON output for programmatic use


## License

MIT
