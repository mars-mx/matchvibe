#!/usr/bin/env tsx
/**
 * Test script for GrokService
 * Usage: npm run test:grok -- username1 username2
 * Or: tsx scripts/test-grok-service.ts username1 username2
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.warn(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.warn();
  log(`${'='.repeat(60)}`, colors.dim);
  log(title, colors.bright);
  log(`${'='.repeat(60)}`, colors.dim);
}

function logResult(result: VibeAnalysisResult) {
  log(
    `\n🎯 Vibe Score: ${result.score}/100`,
    result.score >= 70 ? colors.green : result.score >= 40 ? colors.yellow : colors.red
  );
  log(`   Type: ${result.vibeType}`, colors.magenta);

  log(`\n📊 Analysis:`, colors.bright);
  log(`   ${result.analysis}`, colors.reset);

  if (result.strengths && result.strengths.length > 0) {
    log(`\n✅ Strengths:`, colors.green);
    result.strengths.forEach((strength: string) => {
      log(`   • ${strength}`, colors.reset);
    });
  }

  if (result.challenges && result.challenges.length > 0) {
    log(`\n⚠️  Challenges:`, colors.yellow);
    result.challenges.forEach((challenge: string) => {
      log(`   • ${challenge}`, colors.reset);
    });
  }

  if (result.sharedInterests && result.sharedInterests.length > 0) {
    log(`\n🎨 Shared Interests:`, colors.cyan);
    log(`   ${result.sharedInterests.join(', ')}`, colors.reset);
  }

  if (result.recommendation) {
    log(`\n💡 Recommendation:`, colors.magenta);
    log(`   ${result.recommendation}`, colors.reset);
  }
}

async function testGrokService(userOne: string, userTwo: string) {
  try {
    // Dynamic import to ensure env vars are loaded first
    const { GrokService } = await import('../features/vibe-analysis/services/grok/grok.service');
    const { getGrokApiKey } = await import('../lib/env');

    // Check for API key
    let apiKey: string;
    try {
      apiKey = getGrokApiKey();
    } catch {
      log('❌ Error: GROK_API_KEY not found or invalid', colors.red);
      log('Please add GROK_API_KEY to your .env.local file', colors.yellow);
      log('The key should start with "xai-"', colors.yellow);
      process.exit(1);
    }

    log('🚀 Initializing GrokService...', colors.cyan);
    const service = new GrokService(apiKey);

    logSection('ANALYZING VIBE COMPATIBILITY');

    log(`\n🔮 Analyzing compatibility between @${userOne} and @${userTwo}...`, colors.magenta);
    log(
      '📡 Fetching profiles and analyzing vibes (profiles fetched in parallel)...',
      colors.yellow
    );

    const result = await service.analyzeVibe({
      userOne,
      userTwo,
    });

    logResult(result);

    logSection('TEST COMPLETED SUCCESSFULLY');
    log('✨ All operations completed successfully!', colors.green);
  } catch (error) {
    logSection('ERROR');
    if (error instanceof Error) {
      log(`❌ ${error.message}`, colors.red);
      if (error.stack) {
        log('\nStack trace:', colors.dim);
        console.error(error.stack);
      }
    } else {
      log(`❌ Unknown error occurred`, colors.red);
      console.error(error);
    }
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    log('❌ Invalid usage', colors.red);
    log('Usage: npm run test:grok -- username1 username2', colors.yellow);
    log('Example: npm run test:grok -- elonmusk sama', colors.dim);
    process.exit(1);
  }

  const [userOne, userTwo] = args;

  logSection('GROK SERVICE TEST');
  log(`Testing vibe compatibility between @${userOne} and @${userTwo}`, colors.cyan);

  await testGrokService(userOne, userTwo);
}

// Run the test
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
