# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cursor Usage Analyzer is a CLI tool that analyzes Cursor API usage, token consumption, and billing information. It extracts credentials from the local Cursor database and fetches usage data from Cursor's API endpoints.

## Development Commands

```bash
# Run the CLI (development mode with tsx)
npm run dev                          # Show billing summary (default)
npm run dev -- daily                 # Show last 7 days usage
npm run dev -- daily 30              # Show last 30 days usage
npm run dev -- monthly               # Show last 3 months usage
npm run dev -- today                 # Show detailed today's usage
npm run dev -- daily --breakdown     # Include per-model breakdown
npm run dev -- --since 2026-01-01 --until 2026-01-15

# Build and test
npm run build                        # Compile TypeScript to dist/
npm test                             # Run tests with vitest
npm run lint                         # Lint with eslint
npm run format                       # Format with prettier
```

## Architecture

### Data Flow

1. **Credential Extraction** (`data-loader.ts`)
   - Reads Cursor's SQLite database at `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
   - Extracts: User ID (from `workbench.experiments.statsigBootstrap`), Access Token, Email, Membership
   - Returns `CursorCredentials` object

2. **API Authentication** (`data-loader.ts`)
   - Creates session token: `${userId}::${accessToken}`
   - Sets cookie: `WorkosCursorSessionToken=${sessionToken}`
   - Authenticates against Cursor API endpoints

3. **Data Fetching**
   - **Summary endpoint**: `https://cursor.com/api/usage-summary` (GET) - Billing info, plan usage, membership
   - **Events endpoint**: `https://cursor.com/api/dashboard/get-filtered-usage-events` (POST) - Granular usage events with timestamps

4. **Processing Pipeline** (`event-loader.ts`)
   - Groups events by day/month using ISO date keys
   - Calculates aggregated statistics (tokens, costs, model usage)
   - Formats data for table display

5. **CLI Output** (`cli.ts`, `commands.ts`)
   - Routes commands to appropriate handlers
   - Displays formatted tables with usage statistics
   - Supports JSON output (partial implementation)

### Module Responsibilities

- **index.ts**: Entry point, catches fatal errors
- **cli.ts**: Command routing, argument parsing, default summary display
- **commands.ts**: Report generation (daily, monthly, date-specific)
- **data-loader.ts**: Database access, API communication, credential management
- **event-loader.ts**: Event fetching, grouping, statistics calculation, model breakdown
- **args-parser.ts**: CLI argument parsing (commands, flags, parameters)
- **table-formatter.ts**: ASCII table formatting with automatic column sizing
- **logger.ts**: Colored console logging utilities
- **_types.ts**: TypeScript type definitions
- **_consts.ts**: Configuration constants (paths, URLs, database keys)

### Key Data Structures

- **UsageEvent**: Individual API call record with timestamp, model, token counts (input/output/cache), cost
- **DailyStats/MonthlyStats**: Aggregated statistics for time periods
- **CursorCredentials**: Authentication data extracted from local database
- **UsageSummary**: Billing cycle information and plan usage from API

## Important Implementation Details

### Database Reading
- Uses `sql.js` to read SQLite database without native dependencies
- Database values are stored as JSON strings that need parsing
- User ID is nested in `statsigBootstrap` JSON structure

### Cost Calculation
- API returns costs in cents (`totalCents` field)
- Convert to dollars by dividing by 100: `cost = totalCents / 100`

### Token Aggregation
- Total tokens = inputTokens + outputTokens + cacheWriteTokens + cacheReadTokens
- All token fields default to 0 if missing

### Date Handling
- Dates are converted to millisecond timestamps for API requests
- Internal grouping uses ISO date keys: `YYYY-MM-DD` for days, `YYYY-MM` for months
- Always set proper time boundaries (start of day: 0:0:0, end of day: 23:59:59)

### Model Breakdown
- Tracks event count per model using Map<string, number>
- Calculates percentage of total tokens/cost for each model
- Sorted by total tokens (descending) for display

## Platform-Specific Notes

- Database path is currently hardcoded for macOS: `~/Library/Application Support/Cursor/...`
- For cross-platform support, Windows uses `%APPDATA%/Cursor/...`, Linux uses `~/.config/Cursor/...`
- Can override via `CURSOR_DATA_DIR` environment variable (partial support)
