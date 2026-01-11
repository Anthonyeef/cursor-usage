# Cursor Usage - Feature Roadmap (Based on ccusage)

## Analysis of ccusage Commands

### 1. **View Modes** (What we can learn)
ccusage supports multiple perspectives on the same data:
```
npx ccusage daily     # Day-by-day breakdown
npx ccusage monthly   # Month aggregated
npx ccusage session   # By conversation session
npx ccusage blocks    # 5-hour billing windows
npx ccusage statusline # Compact single-line output
```

**For cursor-usage:**
- ✅ Already have: `daily`, `today` (detailed events)
- 🎯 Can add: `monthly`, `weekly`, `blocks` (5-hour windows), `compact`/`statusline`
- ❓ Session-based: Cursor doesn't track conversations like Claude Code

### 2. **Date Range Filtering** (Essential feature)
```
npx ccusage daily --since 20250525 --until 20250530
```

**For cursor-usage:**
- Currently: Fixed day ranges (`daily 7`, `daily 30`)
- Can upgrade to: `--since YYYY-MM-DD --until YYYY-MM-DD`
- Example: `cursor-usage daily --since 2026-01-01 --until 2026-01-31`

### 3. **Output Formats**
```
npx ccusage daily --json          # Structured data for tools
npx ccusage daily --breakdown     # Per-model cost breakdown
npx ccusage --compact             # Narrow terminal friendly
```

**For cursor-usage:**
- ✅ Table formatting already works
- Can add: `--json`, `--breakdown`, `--compact`

### 4. **Display Options**
```
npx ccusage daily --timezone UTC         # Different timezone
npx ccusage daily --locale ja-JP         # Different date format
```

**For cursor-usage:**
- Can add: `--timezone` (system locale works now)
- Can add: `--locale` (system locale works now)

### 5. **Project/Multi-Instance**
```
npx ccusage daily --instances              # Group by instance
npx ccusage daily --project myproject      # Filter to project
```

**For cursor-usage:**
- ❌ Not applicable (single user account, not team)
- But could filter by model or request type

### 6. **Compact Mode**
```
npx ccusage --compact        # Narrow table for screenshots
```

**For cursor-usage:**
- Can add: `--compact` flag for narrow displays

---

## Priority Implementation Order

### Phase 1: Core Functionality (Already done ✅)
- ✅ Daily report
- ✅ Today's detailed view
- ✅ Summary view
- ✅ Help command

### Phase 2: Essential Features (High Impact)
**1. Monthly Aggregation**
```bash
cursor-usage monthly            # Current month
cursor-usage monthly 3          # Last 3 months
```

**2. Date Range Filtering**
```bash
cursor-usage daily --since 2026-01-01 --until 2026-01-15
cursor-usage --since 2026-01-01              # From date onward
```

**3. Per-Model Breakdown**
```bash
cursor-usage daily --breakdown
# Shows cost per model
```

**4. JSON Output**
```bash
cursor-usage daily --json       # For scripting/processing
```

### Phase 3: Nice-to-Have Features
**1. Compact Mode**
```bash
cursor-usage daily --compact    # Narrow table
```

**2. Different Output Formats**
```bash
cursor-usage daily --csv        # CSV export
cursor-usage daily --html       # HTML report
```

**3. Statusline (Single line)**
```bash
cursor-usage statusline
# Output: "Jan 11: 539K tokens | $0.82 | 81/2000 (4%)"
```

**4. Weekly Aggregation**
```bash
cursor-usage weekly
cursor-usage weekly 4           # Last 4 weeks
```

---

## Implementation Plan

### Phase 2a: Monthly Report
```bash
cursor-usage monthly
cursor-usage monthly 3
cursor-usage monthly --since 2025-12-01
```

**What to implement:**
1. Aggregate daily stats into months
2. Show per-month totals
3. Support month range queries

**Code changes:**
- Add `showMonthlyReport()` to commands.ts
- Add aggregation logic to event-loader.ts

### Phase 2b: Date Range Filtering
```bash
cursor-usage daily --since 2026-01-01 --until 2026-01-15
```

**What to implement:**
1. Parse --since and --until flags
2. Replace fixed date calculations
3. Validate date formats

**Code changes:**
- Update argument parsing in index.ts
- Modify event fetching to use custom dates
- Add date validation utility

### Phase 2c: Breakdown Flag
```bash
cursor-usage daily --breakdown
```

**What to implement:**
1. Calculate per-model costs
2. Add breakdown section to output
3. Show model usage percentages

**Output example:**
```
===== PER-MODEL BREAKDOWN =====
claude-4.5-opus-high-thinking: 539,301 tokens | $0.82 (100%)
```

### Phase 2d: JSON Output
```bash
cursor-usage daily --json
```

**What to implement:**
1. Structured JSON export
2. Timestamps in ISO format
3. Include all computed values

**Output example:**
```json
{
  "period": "daily",
  "days": 7,
  "generated_at": "2026-01-11T12:00:00Z",
  "data": [
    {
      "date": "2026-01-11",
      "events": 3,
      "tokens": 539301,
      "cost": 0.82,
      "models": { "claude-4.5-opus-high-thinking": 3 }
    }
  ]
}
```

---

## Argument Parsing Strategy

Current:
```bash
cursor-usage daily 7
```

Proposed enhancement:
```bash
cursor-usage [COMMAND] [OPTIONS]

Commands:
  daily              Daily report
  monthly            Monthly report
  weekly             Weekly report
  today              Today's details
  summary            Summary view
  help               Help

Options:
  --since DATE       Start date (YYYY-MM-DD)
  --until DATE       End date (YYYY-MM-DD)
  --days N           Last N days (alternative to --since/--until)
  --json             JSON output
  --breakdown        Per-model breakdown
  --compact          Compact table
  --timezone TZ      Set timezone
  --locale LOCALE    Set locale
```

Example usage:
```bash
cursor-usage daily --since 2026-01-01 --until 2026-01-31
cursor-usage monthly --breakdown --json
cursor-usage daily --days 30 --compact
```

---

## Data Structure for Phase 2

### Monthly Stats Interface
```typescript
interface MonthlyStats {
  year: number;
  month: number;           // 1-12
  monthName: string;       // "January"
  eventCount: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  dailyBreakdown: DailyStats[];
  models: Map<string, { tokens: number; cost: number; count: number }>;
}
```

### Weekly Stats Interface
```typescript
interface WeeklyStats {
  week: number;
  year: number;
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  eventCount: number;
  totalTokens: number;
  totalCost: number;
  dailyBreakdown: DailyStats[];
}
```

---

## Quick Wins (Easy to Implement)

### 1. Compact Mode
- Reduce column widths
- Hide optional columns
- One model per line instead of comma-separated

### 2. Weekly Aggregation
- Sum daily data into weeks
- Show week number and date range

### 3. Breakdown Table
- New table after main report
- Model | Tokens | Cost | %

### 4. Statusline
- Single line output for prompt/status
- Format: `Date: Events | Tokens | Cost | Usage%`

---

## Comparison: ccusage vs cursor-usage

| Feature | ccusage | cursor-usage (Now) | cursor-usage (Phase 2) |
|---------|---------|-------------------|----------------------|
| Daily report | ✅ | ✅ | ✅ |
| Monthly report | ✅ | ❌ | 🎯 Planned |
| Weekly report | ❌ | ❌ | 🎯 Planned |
| Session-based | ✅ | ❌ | ❌ (not applicable) |
| 5-hour blocks | ✅ | ❌ | ❌ (not applicable) |
| Date filtering | ✅ | ❌ | 🎯 Planned |
| JSON output | ✅ | ❌ | 🎯 Planned |
| Per-model breakdown | ✅ | ✅ | 🎯 Enhanced |
| Compact mode | ✅ | ❌ | 🎯 Planned |
| Statusline | ✅ | ❌ | 🎯 Planned |
| Timezone support | ✅ | Partial | 🎯 Enhanced |
| Multi-project | ✅ | ❌ | ❌ (not applicable) |

---

## Next Priority

**Start with Phase 2a (Monthly Report)** because:
1. Easiest to implement (just aggregation)
2. Users already ask for monthly data
3. Sets foundation for other features
4. Reuses existing daily stats code

Then **Phase 2b (Date Range)** because:
1. Most requested feature
2. Enables custom date queries
3. Foundation for filtering across all reports
