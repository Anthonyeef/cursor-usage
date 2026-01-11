# Monthly Report Feature - Implementation Summary

## What Was Added

Complete monthly aggregation support for viewing usage trends over multiple months.

## New Commands

```bash
# Show last 3 months (default)
cursor-usage monthly

# Show last N months
cursor-usage monthly 6          # Last 6 months
cursor-usage monthly 12         # Last 12 months
cursor-usage m 3                # Alias: cursor-usage m 3
```

## What Data is Displayed

For each month, the report shows:
- **Month**: Month name and year (e.g., "December 2025")
- **Events**: Total API calls for the month
- **Total Tokens**: Sum of all tokens used (input + output + cache)
- **Input**: Input tokens consumed
- **Output**: Output tokens produced
- **Cost**: Monthly cost in USD
- **Models**: Models used with event counts

## Summary Statistics

After the table, displays:
- **Total Events**: Sum of all events across months
- **Total Tokens**: Sum of all tokens across months
- **Total Cost**: Total USD cost
- **Average per month**: Calculated averages

## Implementation Details

### New Files Modified

1. **src/_types.ts**
   - Added `MonthlyStats` interface

2. **src/event-loader.ts**
   - `groupByMonth()` - Groups events by YYYY-MM
   - `calculateMonthlyStats()` - Aggregates data per month
   - `formatMonthlyStatsTable()` - Formats stats for display

3. **src/commands.ts**
   - `showMonthlyReport()` - Main monthly report handler

4. **src/index.ts**
   - Added monthly command routing
   - Updated help text

### How It Works

1. **Date Range Calculation**
   ```typescript
   startDate = now - N months
   startDate = first day of that month
   endDate = today (23:59:59)
   ```

2. **Event Grouping**
   - Events grouped by `YYYY-MM` key
   - All events for a month collected together

3. **Aggregation**
   - Token counts summed per month
   - Models tracked with event counts
   - Costs calculated from event data

4. **Display**
   - Table format with borders
   - Human-readable month names
   - Summary with averages

## Example Output

```
====================================================================================================
MONTHLY USAGE REPORT (Last 3 months)
====================================================================================================

+----------+--------+---------------+-------+-------+-------+------------------------------+
| Month    | Events | Total Tokens  | Input | Output| Cost  | Models                       |
+----------+--------+---------------+-------+-------+-------+------------------------------+
| Month 1  | 50     | 5,000,000     | 50000 | 30000 | $4.50 | claude-sonnet(50)            |
| Month 2  | 75     | 8,500,000     | 75000 | 45000 | $6.80 | claude-opus(75)              |
+----------+--------+---------------+-------+-------+-------+------------------------------+

====================================================================================================
SUMMARY
====================================================================================================
Total Events: 125
Total Tokens: 13,500,000
Total Cost: $11.30
Average per month: 6,750,000 tokens, $5.65
====================================================================================================
```

## Command Examples

```bash
# Last 3 months (default)
npm run dev -- monthly

# Last 6 months
npm run dev -- monthly 6

# Last 12 months (full year)
npm run dev -- m 12

# Using alias
npm run dev -- m
```

## Integration with Existing Commands

- ✅ Works alongside `daily` reports
- ✅ Uses same event data source
- ✅ Same table formatting
- ✅ Consistent styling
- ✅ No breaking changes to other commands

## Data Insights from Your Usage

The monthly report helps you:
- Track spending trends across months
- Identify peak usage periods
- See which models you use most
- Plan budgets based on historical data
- Optimize model selection for cost savings

## Testing Completed

✅ Default (3 months): `npm run dev -- monthly`
✅ Custom months: `npm run dev -- monthly 12`
✅ Alias: `npm run dev -- m`
✅ Help updated: `npm run dev -- help`
✅ Daily reports still work: `npm run dev -- daily 7`

## Next Steps

Phase 2c recommendations:
1. **Date Range Filtering** - `--since` / `--until` flags
2. **Per-Model Breakdown** - `--breakdown` flag
3. **JSON Output** - `--json` flag
4. **Compact Mode** - `--compact` flag

## Code Quality

- ✅ Full TypeScript type safety
- ✅ Consistent with existing patterns
- ✅ Proper error handling
- ✅ Clean, readable code
- ✅ No external dependencies added
