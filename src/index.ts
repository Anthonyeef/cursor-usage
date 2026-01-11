#!/usr/bin/env tsx

/**
 * Cursor Usage Analyzer
 * A CLI tool for analyzing Cursor API usage and token consumption
 */

import { getCursorCredentials, fetchUsageData } from './data-loader';
import { showDailyReport, showMonthlyReport, showDateReport } from './commands';
import { logger } from './logger';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || 'summary';

  // Step 1: Extract credentials
  const credentials = await getCursorCredentials();

  if (!credentials) {
    logger.error('Failed to load credentials from local database');
    process.exit(1);
  }

  // Step 2: Execute command
  if (command === 'daily' || command === 'd') {
    const days = parseInt(args[1] || '7', 10);
    await showDailyReport(credentials, days);
  } else if (command === 'monthly' || command === 'm') {
    const months = parseInt(args[1] || '3', 10);
    await showMonthlyReport(credentials, months);
  } else if (command === 'today') {
    await showDateReport(credentials, new Date());
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
  logger.log(`  Billing Cycle: ${formatDate(data.billingCycleStart)} to ${formatDate(data.billingCycleEnd)}`);

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

Examples:
  cursor-usage              # Show summary
  cursor-usage daily        # Show last 7 days of usage
  cursor-usage daily 30     # Show last 30 days of usage
  cursor-usage monthly      # Show last 3 months of usage
  cursor-usage monthly 6    # Show last 6 months of usage
  cursor-usage today        # Show detailed usage for today

Environment Variables:
  DEBUG         Enable debug logging
  `);
}

main().catch((error) => {
  logger.error(`Unexpected error: ${String(error)}`);
  process.exit(1);
});
