# Cursor Usage Analyzer - Latest Update

## What's New

Added detailed usage event tracking with table views, similar to `ccusage`.

## New Features

### 1. Detailed Usage Events API
- Integrated `https://cursor.com/api/dashboard/get-filtered-usage-events` endpoint
- Fetches granular usage data with timestamp, model, and token breakdown
- Supports date range filtering

### 2. Daily Usage Reports
```bash
npm run dev -- daily        # Last 7 days
npm run dev -- daily 30     # Last 30 days
npm run dev -- daily N      # Last N days
```

Displays table with:
- Date
- Number of events
- Total tokens (including cache tokens)
- Input/output token breakdown
- Cost in dollars
- Models used

### 3. Detailed Event View
```bash
npm run dev -- today
```

Shows individual events with:
- Time of request
- Model used
- Input/output tokens
- Cache read/write tokens
- Total tokens
- Cost

### 4. Help Command
```bash
npm run dev -- help
```

Shows all available commands and usage examples.

## Implementation Details

### New Files Added
1. **event-loader.ts** - Fetches and parses usage events from API
2. **table-formatter.ts** - Formats data into ASCII tables
3. **commands.ts** - CLI command handlers

### Updated Files
1. **index.ts** - Command routing and help system
2. **_consts.ts** - Added events API URL
3. **_types.ts** - Updated to reflect actual API response

### Key Technical Achievements

1. **Reverse-engineered API Response Structure**
   - Discovered `usageEventsDisplay` contains detailed usage events
   - Identified `tokenUsage` object with input, output, cache tokens
   - Mapped `totalCents` field to cost calculation

2. **Origin Header Fix**
   - Added required `Origin: https://cursor.com` header
   - Resolved 403 "Invalid origin for state-changing request" error

3. **Token Calculation**
   - Properly calculates total tokens from:
     - Input tokens
     - Output tokens
     - Cache write tokens
     - Cache read tokens

4. **Cost Tracking**
   - Converts `totalCents` from API to dollars
   - Displays per-event and aggregated costs

## API Responses

### Actual Response Structure

```json
{
  "totalUsageEventsCount": 3,
  "usageEventsDisplay": [
    {
      "timestamp": "1768103236039",
      "model": "claude-4.5-opus-high-thinking",
      "kind": "USAGE_EVENT_KIND_INCLUDED_IN_PRO",
      "maxMode": true,
      "requestsCosts": 5.6,
      "tokenUsage": {
        "inputTokens": 54,
        "outputTokens": 960,
        "cacheWriteTokens": 17044,
        "cacheReadTokens": 112452,
        "totalCents": 22.44
      },
      "isChargeable": true
    }
  ]
}
```

## File Structure

```
src/
├── index.ts              # CLI entry & command routing
├── data-loader.ts        # API integration (summary & credentials)
├── event-loader.ts       # Event fetching & parsing (NEW)
├── commands.ts           # Command handlers (NEW)
├── table-formatter.ts    # Table rendering (NEW)
├── logger.ts             # Logging utilities
├── _types.ts             # TypeScript types
├── _consts.ts            # Constants
└── sql.d.ts              # SQL.js type definitions
```

## Key Features

The tool provides:
- Real-time usage tracking from Cursor API
- Multiple time period views (daily, monthly, today)
- Per-model breakdown of costs
- Token usage analytics
- Cost calculations in USD
- Beautiful table formatting for easy reading

## Testing Results

✅ All commands working:
- `npm run dev` - Summary view
- `npm run dev -- daily` - Daily report (7 days default)
- `npm run dev -- daily 30` - 30-day report
- `npm run dev -- today` - Today's detailed events
- `npm run dev -- help` - Help message

✅ Table formatting working correctly
✅ Cost calculations accurate
✅ Date grouping functional
✅ Model breakdown tracking

## Next Steps for Enhancement

1. **Date Range Queries** - Add `--from` and `--to` flags
2. **JSON Export** - `--json` flag for scripting
3. **Weekly/Monthly Views** - Aggregate by week/month
4. **Historical Tracking** - Cache and compare over time
5. **Projections** - Estimate monthly usage based on current rate
6. **Team Analysis** - If API supports team data
7. **Web Dashboard** - Real-time monitoring UI

## Comparison to ccusage

| Feature | ccusage | cursor-usage |
|---------|---------|--------------|
| Multiple tools | ✅ (Amp, Codex, Claude) | ✅ (Could be extended) |
| Daily reports | ✅ | ✅ |
| Monthly reports | ✅ | ⏳ Planned |
| Per-model breakdown | ✅ | ✅ |
| Cost tracking | ✅ | ✅ |
| Cache tokens | ✅ | ✅ |
| Table formatting | ✅ | ✅ |
| JSON output | ✅ | ⏳ Planned |

## Notes

- The tool now provides much richer data than the summary-only version
- Cache tokens (read/write) are tracked separately and included in totals
- Time zone is based on system locale
- All data is real-time (no caching)
- API response includes `maxMode` flag indicating if max model was used

This update brings cursor-usage much closer to the feature parity with ccusage while maintaining simplicity and focus on Cursor-specific tracking.
