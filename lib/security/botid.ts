import { checkBotId } from 'botid/server';

/**
 * Protected paths configuration for Bot ID
 * These endpoints will be protected against bot traffic
 */
export const PROTECTED_PATHS = [{ path: '/api/vibe/analyze', method: 'POST' as const }] as const;

/**
 * Bot ID verification result from the actual library
 */
export type BotIdResult = Awaited<ReturnType<typeof checkBotId>>;

/**
 * Server-side bot verification using Vercel Bot ID
 * Note: This only works when deployed on Vercel
 * In development, it will bypass and return isHuman: true
 */
export async function verifyBotId(): Promise<BotIdResult | null> {
  try {
    // In development, you can control behavior with bypass option
    const result = await checkBotId({
      developmentOptions: {
        // Uncomment to test bot behavior in development:
        // bypass: 'BAD-BOT', // Test as bot
        // bypass: 'GOOD-BOT', // Test as verified bot
        // bypass: 'HUMAN', // Test as human (default)
      },
    });

    return result;
  } catch (error) {
    // Bot ID verification requires Vercel infrastructure
    // Will fail in local development without proper setup
    console.warn('[BotId] Verification failed (expected in local dev):', error);
    return null;
  }
}

/**
 * Determine if a request should be blocked based on bot status
 * @param result - Bot ID verification result
 * @returns true if the request should be blocked
 */
export function shouldBlockRequest(result: BotIdResult | null): boolean {
  if (!result) {
    // If verification fails, allow in development, block in production
    return process.env.NODE_ENV === 'production';
  }

  // Block bad bots, allow humans and verified bots (like Google)
  return result.isBot && !result.isVerifiedBot;
}

/**
 * Format bot verification result for logging
 */
export function formatBotIdResult(result: BotIdResult | null): string {
  if (!result) {
    return 'Bot ID verification unavailable';
  }

  if (result.bypassed) {
    return 'BYPASSED (development mode)';
  }

  if (result.isHuman) {
    return 'HUMAN';
  }

  if (result.isVerifiedBot) {
    return `VERIFIED BOT (${result.verifiedBotName || 'Unknown'})`;
  }

  if (result.isBot) {
    return 'BOT (blocked)';
  }

  return 'UNKNOWN';
}
