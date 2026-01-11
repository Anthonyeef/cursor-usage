/**
 * CLI command routing and argument handling
 */

import { getCursorCredentials, fetchUsageData } from './data-loader.js';
import {
  showDailyReport,
  showMonthlyReport,
  showWeeklyReport,
  showDateReport,
  statsToJSON,
} from './commands.js';
import { logger } from './logger.js';
import {
  parseArgs,
  getNumberFlag,
  getDateFlag,
  getBoolFlag,
} from './args-parser.js';
import { createTitleBox, colors } from './table-formatter.js';

export async function runCLI(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);
  const { command, params, flags } = parsed;

  // Load credentials
  const credentials = await getCursorCredentials();
  if (!credentials) {
    logger.error('Failed to load credentials from local database');
    process.exit(1);
  }

  // Get common flags
  const breakdown = getBoolFlag(flags, 'breakdown');
  const json = getBoolFlag(flags, 'json');
  const sinceDate = getDateFlag(flags, 'since');
  const untilDate = getDateFlag(flags, 'until');

  // Route commands
  if (command === 'daily' || command === 'd') {
    const days = getNumberFlag(flags, 'days') || getNumberFlag({ [params[0] || '']: params[0] }, '', 7);
    const numDays = params.length > 0 && !isNaN(Number(params[0])) ? Number(params[0]) : days;

    const options = {
      breakdown,
      startDate: sinceDate || undefined,
      endDate: untilDate || undefined,
      compact: getBoolFlag(flags, 'compact')
    };

    await showDailyReport(credentials, numDays, options, json);
  } else if (command === 'monthly' || command === 'm') {
    const months = params.length > 0 && !isNaN(Number(params[0])) ? Number(params[0]) : 3;

    const options = {
      breakdown,
      startDate: sinceDate || undefined,
      endDate: untilDate || undefined,
      compact: getBoolFlag(flags, 'compact')
    };

    await showMonthlyReport(credentials, months, options, json);
  } else if (command === 'weekly' || command === 'w') {
    const weeks = params.length > 0 && !isNaN(Number(params[0])) ? Number(params[0]) : 4;

    const options = {
      breakdown,
      startDate: sinceDate || undefined,
      endDate: untilDate || undefined,
      compact: getBoolFlag(flags, 'compact')
    };

    await showWeeklyReport(credentials, weeks, options, json);
  } else if (command === 'today') {
    const options = { breakdown, compact: getBoolFlag(flags, 'compact') };

    await showDateReport(credentials, new Date(), options, json);
  } else if (command === 'help' || command === '-h' || command === '--help') {
    showHelp();
  } else {
    // Default: show summary
    const usageData = await fetchUsageData(credentials);

    if (!usageData) {
      logger.error('Failed to fetch usage data');
      process.exit(1);
    }

    logger.log('');
    displayResults(usageData);
  }
}

function displayResults(data: any) {
  logger.log(createTitleBox('Cursor Usage Summary'));

  // Membership and plan info
  logger.log(colors.cyan('📋 ACCOUNT INFORMATION'));
  logger.log(`  ${colors.dim('Membership:')}     ${colors.yellow(data.membershipType || 'N/A')}`);
  logger.log(
    `  ${colors.dim('Billing Cycle:')} ${colors.yellow(formatDate(data.billingCycleStart))} to ${colors.yellow(formatDate(data.billingCycleEnd))}`
  );

  // Plan usage
  const plan = data.individualUsage?.plan;
  if (plan) {
    logger.log('');
    logger.log(colors.cyan('📊 PLAN USAGE'));
    const percentage = plan.limit > 0 ? ((plan.used / plan.limit) * 100).toFixed(2) : '0.00';
    logger.log(`  ${colors.dim('Used:')}      ${colors.yellow(`${plan.used} / ${plan.limit}`)} (${colors.green(percentage + '%')})`);
    logger.log(`  ${colors.dim('Remaining:')} ${colors.yellow(String(plan.limit - plan.used))}`);
    logger.log(`  ${colors.dim('Breakdown:')}`);
    logger.log(`    ${colors.dim('- Included:')} ${colors.yellow(String(plan.breakdown?.included || 0))}`);
    logger.log(`    ${colors.dim('- Bonus:')}    ${colors.yellow(String(plan.breakdown?.bonus || 0))}`);
    logger.log(`    ${colors.dim('- Total:')}    ${colors.yellow(String(plan.breakdown?.total || 0))}`);
  }

  // On-demand usage
  const onDemand = data.individualUsage?.onDemand;
  if (onDemand && onDemand.enabled) {
    logger.log('');
    logger.log(colors.cyan('💰 ON-DEMAND USAGE'));
    logger.log(`  ${colors.dim('Used:')}   ${colors.yellow(String(onDemand.used))}`);
    if (onDemand.limit !== null) {
      logger.log(`  ${colors.dim('Limit:')}  ${colors.yellow(String(onDemand.limit))}`);
      const remaining = onDemand.remaining !== null ? onDemand.remaining : (onDemand.limit - onDemand.used);
      logger.log(`  ${colors.dim('Remaining:')} ${colors.yellow(String(remaining))}`);
    }
    logger.log(`  ${colors.dim('Status:')} ${colors.green('Enabled')}`);
  }

  // Display messages
  if (data.autoModelSelectedDisplayMessage) {
    logger.log('');
    logger.log(colors.cyan('📢 AUTO MODEL MESSAGE'));
    logger.log(`  ${colors.dim(data.autoModelSelectedDisplayMessage)}`);
  }

  if (data.namedModelSelectedDisplayMessage) {
    logger.log('');
    logger.log(colors.cyan('💬 NAMED MODEL MESSAGE'));
    logger.log(`  ${colors.dim(data.namedModelSelectedDisplayMessage)}`);
  }

  logger.log('');
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function showHelp() {
  logger.log(`
CURSOR USAGE ANALYZER - CLI COMMANDS

Usage: cursor-usage [COMMAND] [OPTIONS]

Commands:
  (none)        Show current billing summary (default)
  daily [N]     Show daily usage for last N days (default: 7)
  d [N]         Alias for 'daily'
  weekly [N]    Show weekly usage for last N weeks (default: 4)
  w [N]         Alias for 'weekly'
  monthly [N]   Show monthly usage for last N months (default: 3)
  m [N]         Alias for 'monthly'
  today         Show detailed usage for today
  help          Show this help message
  -h, --help    Show this help message

Flags:
  --since DATE     Start date (YYYY-MM-DD)
  --until DATE     End date (YYYY-MM-DD)
  --breakdown      Show per-model breakdown
  --json           Output as JSON (in development)
  --compact        Compact table format

Examples:
  cursor-usage                                           # Show summary
  cursor-usage daily                                     # Show last 7 days
  cursor-usage daily 30                                  # Show last 30 days
  cursor-usage daily --since 2026-01-01 --until 2026-01-15
  cursor-usage weekly                                    # Show last 4 weeks
  cursor-usage weekly 8                                  # Show last 8 weeks
  cursor-usage monthly                                   # Show last 3 months
  cursor-usage monthly 6                                 # Show last 6 months
  cursor-usage daily --breakdown                         # With model breakdown
  cursor-usage weekly --breakdown --json                 # JSON output
  cursor-usage today                                     # Today's details

Environment Variables:
  DEBUG         Enable debug logging
  `);
}
