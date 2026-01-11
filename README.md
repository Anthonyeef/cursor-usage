# Cursor Usage Analyzer

![Cursor Usage Banner](banner.png)

A CLI tool for analyzing Cursor API usage and membership information, inspired by [ccusage](https://github.com/ryoppippi/ccusage).

## Features

- Extract Cursor credentials from local database
- Fetch usage data from Cursor API
- Display membership and plan usage information
- Show usage breakdown (included vs bonus)
- Track percentage of included usage consumed
- Colorful terminal output

## Installation

```bash
npm install
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

```
ACCOUNT INFORMATION:
  Membership: pro
  Billing Cycle: <your-billing-cycle>

PLAN USAGE:
  Used: 150 / 2000 (7.50%)
  Remaining: 1850
```

### Daily Report View

```
✓ Found 3 usage events

====================================================================================================
DAILY USAGE REPORT (Last 7 days)
====================================================================================================

+------------+--------+--------------+-------+--------+-------+----------------------------------+
| Date       | Events | Total Tokens | Input | Output | Cost  | Models                           |
+------------+--------+--------------+-------+--------+-------+----------------------------------+
| 2026-01-11 | 3      | 539,301      | 381   | 7,081  | $0.82 | claude-4.5-opus-high-thinking(3) |
+------------+--------+--------------+-------+--------+-------+----------------------------------+

====================================================================================================
SUMMARY
====================================================================================================
Total Events: 3
Total Tokens: 539,301
Total Cost: $0.82
====================================================================================================
```

### Monthly Report View

```
====================================================================================================
MONTHLY USAGE REPORT (Last 3 months)
====================================================================================================

+----------+--------+---------------+-------+-------+-------+------------------------------+
| Month    | Events | Total Tokens  | Input | Output| Cost  | Models                       |
+----------+--------+---------------+-------+-------+-------+------------------------------+
| Month 1  | 50     | 5,000,000     | 50000 | 30000 | $4.50 | claude-sonnet(50)            |
| Month 2  | 75     | 8,500,000     | 75000 | 45000 | $6.80 | claude-opus(75)              |
| Month 3  | 25     | 2,500,000     | 20000 | 10000 | $2.00 | claude-haiku(25)             |
+----------+--------+---------------+-------+-------+-------+------------------------------+

====================================================================================================
SUMMARY
====================================================================================================
Total Events: 150
Total Tokens: 16,000,000
Total Cost: $13.30
Average per month: 5,333,333 tokens, $4.43
====================================================================================================
```

### Detailed Event View

```
========================================================================================================================
USAGE EVENTS FOR Today
========================================================================================================================

+----------+---------------+-------+--------------+---------------+--------------+---------+
| Time     | Model         | Type  | Input Tokens | Output Tokens | Total Tokens | Cost    |
+----------+---------------+-------+--------------+---------------+--------------+---------+
| 2:15 pm  | claude-opus   | usage | 500          | 1,200         | 1,700        | $0.0850 |
| 1:45 pm  | claude-sonnet | usage | 300          | 800           | 1,100        | $0.0440 |
| 1:20 pm  | claude-haiku  | usage | 100          | 250           | 350          | $0.0070 |
+----------+---------------+-------+--------------+---------------+--------------+---------+

========================================================================================================================
Total Events: 3
Total Tokens: 3,150
Total Cost: $0.14
==================================================================================================================
```

### Model Breakdown View (`--breakdown`)

When using `--breakdown`, reports include a detailed per-model breakdown:

```
==================================================================================================================
PER-MODEL BREAKDOWN
==================================================================================================================

+---------------+--------+--------------+-------+-------+-------+---------+------------+------------+
| Model         | Events | Total Tokens | Input | Output| Cost  | Token % | Cost %     |
+---------------+--------+--------------+-------+-------+-------+---------+------------+
| claude-opus   | 15     | 2,500,000    | 20000 | 15000 | $2.00 | 50.00%  | 40.00%    |
| claude-sonnet | 10     | 2,000,000    | 15000 | 12000 | $1.60 | 40.00%  | 32.00%    |
| claude-haiku  | 5      | 500,000      | 5000  | 3000  | $0.40 | 10.00%  | 8.00%     |
+---------------+--------+--------------+-------+-------+-------+---------+------------+
```

### JSON Output (`--json`)

JSON output provides clean, structured data for programmatic use (no table formatting):

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

### Compact Table Format (`--compact`)

The `--compact` flag provides a more condensed table layout:

```
==================================================================================================================
DAILY USAGE REPORT (Last 7 days)
==================================================================================================================

Date        Events  Tokens      Cost   Models
2026-01-11  3       539,301     $0.82  claude-4.5-opus-high-thinking(3)
2026-01-10  5       1,200,450   $1.45  claude-sonnet(4), claude-opus(1)
2026-01-09  2       89,320      $0.12  claude-haiku(2)

==================================================================================================================
SUMMARY
==================================================================================================================
Total Events: 10
Total Tokens: 1,829,071
Total Cost: $2.39
==================================================================================================================
```

## Environment Variables

- `CURSOR_DATA_DIR` - Custom path to Cursor data directory (optional)
- `DEBUG` - Enable debug logging

## Project Structure

```
src/
├── index.ts          # CLI entry point & display logic
├── data-loader.ts    # Database extraction & API fetching
├── logger.ts         # Colored logging utilities
├── _types.ts         # TypeScript type definitions
└── _consts.ts        # Constants & configuration
```

## Features Implemented

- ✅ Daily usage reports with table formatting
- ✅ Detailed event breakdown by time
- ✅ Token count tracking (input, output, cache)
- ✅ Cost calculation and display
- ✅ Model usage breakdown
- ✅ Flexible date range querying
- ✅ Colorized CLI output


## License

MIT

## Related Projects

- [ccusage](https://github.com/ryoppippi/ccusage) - Claude Code usage analyzer
- [@ccusage/amp](https://www.npmjs.com/package/@ccusage/amp) - Amp usage analyzer
