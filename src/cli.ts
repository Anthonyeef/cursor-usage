/**
 * CLI command routing and argument handling
 */

import { getCursorCredentials, fetchUsageData } from './data-loader';
import {
  showDailyReport,
  showMonthlyReport,
  showDateReport,
  statsToJSON,
} from './commands';
import { logger } from './logger';
import {
  parseArgs,
  getNumberFlag,
  getDateFlag,
  getBoolFlag,
} from './args-parser';

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

    const options = { breakdown, startDate: sinceDate, endDate: untilDate };

    if (json) {
      console.log('Note: JSON output for date ranges not yet fully supported');
      return;
    }

    await showDailyReport(credentials, numDays, options);
  } else if (command === 'monthly' || command === 'm') {
    const months = params.length > 0 && !isNaN(Number(params[0])) ? Number(params[0]) : 3;

    const options = { breakdown, startDate: sinceDate, endDate: untilDate };

    if (json) {
      console.log('Note: JSON output for date ranges not yet fully supported');
      return;
    }

    await showMonthlyReport(credentials, months, options);
  } else if (command === 'today') {
    const options = { breakdown };

    if (json) {
      console.log('Note: JSON output for today not yet implemented');
      return;
    }

    await showDateReport(credentials, new Date(), options);
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
  logger.log('='.repeat(70));
  logger.log('CURSOR USAGE SUMMARY');
  logger.log('='.repeat(70));

  // Membership and plan info
  logger.log('\n📋 ACCOUNT INFORMATION:');
  logger.log(`  Membership: ${data.membershipType || 'N/A'}`);
  logger.log(
    `  Billing Cycle: ${formatDate(data.billingCycleStart)} to ${formatDate(data.billingCycleEnd)}`
  );

  // Plan usage
  const plan = data.individualUsage?.plan;
  if (plan) {
    logger.log('\n📊 PLAN USAGE:');
    logger.log(`  Used: ${plan.used} / ${plan.limit} (${(plan.totalPercentUsed * 100).toFixed(2)}%)`);
    logger.log(`  Remaining: ${plan.remaining}`);
    logger.log(`  Breakdown:`);
    logger.log(`    - Included: ${plan.breakdown?.included || 0}`);
    logger.log(`    - Bonus: ${plan.breakdown?.bonus || 0}`);
  }

  // On-demand usage
  const onDemand = data.individualUsage?.onDemand;
  if (onDemand && onDemand.enabled) {
    logger.log('\n💰 ON-DEMAND USAGE:');
    logger.log(`  Used: ${onDemand.used}`);
    logger.log(`  Status: Enabled`);
  }

  // Display messages
  if (data.autoModelSelectedDisplayMessage) {
    logger.log('\n📢 AUTO MODEL MESSAGE:');
    logger.log(`  ${data.autoModelSelectedDisplayMessage}`);
  }

  if (data.namedModelSelectedDisplayMessage) {
    logger.log('\n💬 NAMED MODEL MESSAGE:');
    logger.log(`  ${data.namedModelSelectedDisplayMessage}`);
  }

  logger.log('\n' + '='.repeat(70) + '\n');
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
  monthly [N]   Show monthly usage for last N months (default: 3)
  m [N]         Alias for 'monthly'
  today         Show detailed usage for today
  help          Show this help message
  -h, --help    Show this help message

Flags:
  --since DATE     Start date (YYYY-MM-DD)
  --until DATE     End date (YYYY-MM-DD)
  --breakdown      Show per-model breakdown
  --json           Output as JSON
  --compact        Compact table format

Examples:
  cursor-usage                                           # Show summary
  cursor-usage daily                                     # Show last 7 days
  cursor-usage daily 30                                  # Show last 30 days
  cursor-usage daily --since 2026-01-01 --until 2026-01-15
  cursor-usage monthly                                   # Show last 3 months
  cursor-usage monthly 6                                 # Show last 6 months
  cursor-usage daily --breakdown                         # With model breakdown
  cursor-usage monthly --breakdown --json                # JSON output
  cursor-usage today                                     # Today's details

Environment Variables:
  DEBUG         Enable debug logging
  `);
}
