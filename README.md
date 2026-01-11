# Cursor Usage Analyzer

A CLI tool for analyzing Cursor API usage and membership information, inspired by [ccusage](https://github.com/ryoppippi/ccusage).

## Features

- ✨ Extract Cursor credentials from local database
- 🔗 Fetch usage data from Cursor API
- 💳 Display membership and plan usage information
- 📊 Show usage breakdown (included vs bonus)
- 🎯 Track percentage of included usage consumed
- 🎨 Colorful terminal output

## Installation

```bash
npm install
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
```

### Development

```bash
npm run dev              # Run with tsx (default summary)
npm start               # Run with tsx (default summary)
npm run build           # Compile TypeScript
```

## Example Output

### Summary View

```
📊 ACCOUNT INFORMATION:
  Membership: pro
  Billing Cycle: <your-billing-cycle>

📊 PLAN USAGE:
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
========================================================================================================================
```

## How It Works

1. **Extracts credentials** from `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
   - User ID from `workbench.experiments.statsigBootstrap`
   - Access Token from `cursorAuth/accessToken`
   - Email and membership (optional)

2. **Authenticates** with Cursor API using `WorkosCursorSessionToken` cookie

3. **Fetches usage data** from `https://cursor.com/api/usage-summary`

4. **Parses and displays** membership, plan usage, and billing information

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

## API Response Structure

The tool fetches data from Cursor's `/api/usage-summary` endpoint which returns:
- Billing cycle information
- Membership type (pro, hobby, etc.)
- Plan usage (used/limit/remaining)
- On-demand usage status
- Display messages about usage percentage

## Features Implemented

- ✅ Daily usage reports with table formatting
- ✅ Detailed event breakdown by time
- ✅ Token count tracking (input, output, cache)
- ✅ Cost calculation and display
- ✅ Model usage breakdown
- ✅ Flexible date range querying
- ✅ Colorized CLI output

## Future Enhancements

- [ ] JSON output format (`--json`)
- [ ] Date range queries (`--from 2026-01-01 --to 2026-01-31`)
- [ ] Weekly/monthly aggregations
- [ ] Historical data caching
- [ ] Cost projections
- [ ] Team usage analysis
- [ ] Export to CSV/JSON
- [ ] Web dashboard
- [ ] Webhook notifications

## License

MIT

## Related Projects

- [ccusage](https://github.com/ryoppippi/ccusage) - Claude Code usage analyzer
- [@ccusage/amp](https://www.npmjs.com/package/@ccusage/amp) - Amp usage analyzer
