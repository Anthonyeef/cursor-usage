# Cursor Usage Analyzer - Project Plan

## Overview
Create a CLI tool similar to `@ccusage/amp` but for analyzing Cursor API usage and token consumption.

## Data Sources
1. **Local Database**: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
   - User ID: `workbench.experiments.statsigBootstrap` → `user.userID`
   - Access Token: `cursorAuth/accessToken`
   - Email: `cursorAuth/cachedEmail`
   - Membership: `cursorAuth/stripeMembershipType`

2. **API Endpoint**: `https://cursor.com/api/usage-summary`
   - Authentication: `WorkosCursorSessionToken` cookie in format `user_id::jwt_token`

## Project Structure
```
cursor-usage/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── data-loader.ts        # Load credentials from local DB & fetch API data
│   ├── _types.ts             # TypeScript types
│   ├── _consts.ts            # Constants
│   ├── pricing.ts            # Cost calculations
│   ├── commands/             # Command handlers
│   │   ├── daily.ts
│   │   ├── monthly.ts
│   │   ├── session.ts
│   │   └── ...
│   ├── run.ts                # Main execution logic
│   ├── logger.ts             # Logging utilities
│   └── ...
├── package.json
├── tsconfig.json
└── README.md
```

## Key Features
- [x] Extract credentials from local Cursor database
- [x] Fetch usage data from Cursor API
- [ ] Daily usage report
- [ ] Monthly usage report  
- [ ] Per-model cost breakdown
- [ ] Session-based analysis
- [ ] JSON output format
- [ ] Beautiful table formatting (CLI)
- [ ] Cache token tracking
- [ ] Timezone support
- [ ] Configuration files support

## Dependencies (Similar to @ccusage/amp)
- `valibot` - Schema validation
- `tinyglobby` - File globbing
- `gunshi` - CLI utilities
- `picocolors` - Colored output
- `fast-sort` - Fast sorting
- `path-type` - Path utilities
- `@praha/byethrow` - Error handling
- `@ccusage/terminal` - Terminal utilities (from monorepo)
- `@ccusage/internal` - Shared utilities (from monorepo)

## API Response Schema (Expected)
```typescript
interface UsageSummary {
  daily: Array<{
    date: string;
    credits_used: number;
    requests: number;
    tokens: {
      input: number;
      output: number;
    };
  }>;
  monthly: Array<{
    month: string;
    credits_used: number;
  }>;
  subscription: {
    status: string;
    plan: string;
  };
}
```

## Next Steps
1. Create basic project structure
2. Implement data loader (credentials + API fetch)
3. Parse and validate API response
4. Implement daily/monthly commands
5. Add table formatting
6. Test with actual data
