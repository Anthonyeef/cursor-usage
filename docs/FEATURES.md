# Cursor Usage Analyzer - Implementation Summary

## What Was Built

A complete CLI tool for analyzing Cursor API usage and displaying membership information, inspired by the [ccusage](https://github.com/ryoppippi/ccusage) project.

## Key Accomplishments

### ✅ Credentials Extraction
- Reads local Cursor database at `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- Extracts user ID from `workbench.experiments.statsigBootstrap`
- Extracts JWT token from `cursorAuth/accessToken`
- Retrieves optional email and membership type

### ✅ API Integration
- Authenticates with Cursor API using `WorkosCursorSessionToken` cookie
- Fetches usage summary from `https://cursor.com/api/usage-summary`
- Handles authentication errors gracefully

### ✅ Data Display
Shows:
- Account membership type and billing cycle dates
- Plan usage (used/limit/remaining with percentage)
- Usage breakdown (included vs bonus)
- On-demand usage status
- User-friendly display messages from API

### ✅ Colorized Output
- Green checkmarks for successful operations
- Cyan info messages for loading states
- Emoji icons for visual clarity
- Formatted date display

## Project Structure

```
cursor-usage/
├── src/
│   ├── index.ts          # CLI entry point (7KB)
│   ├── data-loader.ts    # DB extraction & API calls (6KB)
│   ├── logger.ts         # Colored logging utilities (1KB)
│   ├── _types.ts         # TypeScript interfaces (2KB)
│   ├── _consts.ts        # Configuration constants (1KB)
│   └── sql.d.ts          # Type definitions for sql.js
├── dist/                 # Compiled TypeScript
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript configuration
├── README.md             # User documentation
├── FEATURES.md           # This file
└── plan.md              # Original project plan
```

## Technologies Used

- **TypeScript** - Type-safe code
- **sql.js** - Pure JavaScript SQLite reader (no native compilation)
- **Node.js Fetch API** - HTTP requests (built-in, no dependencies needed)
- **tsx** - TypeScript execution and build

## Dependencies

Only 1 production dependency:
- `sql.js` - For reading Cursor's SQLite database

Dev dependencies:
- `typescript` - Type checking
- `tsx` - TypeScript execution and bundling

## How to Use

```bash
# Development
npm run dev

# Production
npm start

# Build TypeScript
npm run build

# All available commands
npm run dev     # Run with tsx
npm start       # Run with tsx
npm run build   # Compile TypeScript
npm run test    # Run tests (when added)
npm run lint    # Lint code
npm run format  # Format code
```

## Example Output

```
======================================================================
CURSOR USAGE SUMMARY
======================================================================

📋 ACCOUNT INFORMATION:
  Membership: pro
  Billing Cycle: <billing-cycle-dates>

📊 PLAN USAGE:
  Used: 81 / 2000 (41.54%)
  Remaining: 1919
  Breakdown:
    - Included: 81
    - Bonus: 0

📢 AUTO MODEL MESSAGE:
  You've used 1% of your included total usage

💬 NAMED MODEL MESSAGE:
  You've used 2% of your included API usage

======================================================================
```

## Cursor API Response Structure

The tool successfully reverse-engineered and parses the Cursor API response:

```json
{
  "billingCycleStart": "<iso-timestamp>",
  "billingCycleEnd": "<iso-timestamp>",
  "membershipType": "pro|hobby",
  "limitType": "user",
  "isUnlimited": false,
  "autoModelSelectedDisplayMessage": "You've used X% of your included total usage",
  "namedModelSelectedDisplayMessage": "You've used X% of your included API usage",
  "individualUsage": {
    "plan": {
      "enabled": true,
      "used": <number>,
      "limit": <number>,
      "remaining": <number>,
      "breakdown": {
        "included": <number>,
        "bonus": <number>,
        "total": <number>
      },
      "autoPercentUsed": <float>,
      "apiPercentUsed": <float>,
      "totalPercentUsed": <float>
    },
    "onDemand": {
      "enabled": false|true,
      "used": <number>,
      "limit": <number|null>,
      "remaining": <number|null>
    }
  },
  "teamUsage": {}
}
```

## Future Enhancement Ideas

- [ ] JSON output format for scripting
- [ ] Historical usage tracking
- [ ] Cost projections
- [ ] Team usage analysis
- [ ] CSV export
- [ ] Web dashboard
- [ ] Scheduled reporting
- [ ] Usage alerts

## Technical Highlights

1. **Zero Native Dependencies** - Uses sql.js (pure JavaScript) instead of better-sqlite3
2. **Proper Error Handling** - Graceful fallbacks and helpful error messages
3. **Async/Await** - Modern async patterns for database and API operations
4. **TypeScript** - Full type safety with custom type definitions
5. **Minimal Bundle** - Small footprint suitable for distribution

## Testing

Verified working with:
- ✅ Cursor Pro membership
- ✅ Local database extraction
- ✅ API authentication
- ✅ Data parsing and display
- ✅ Error handling

## Notes for Future Development

1. The script currently reads from local database synchronously - could be optimized
2. API rate limiting not yet implemented
3. No caching of results (each run fetches fresh data)
4. Could add command-line arguments for filtering/formatting
5. Team usage data is available in API response but not currently displayed
