import { NextRequest, NextResponse } from 'next/server';
import { verifyBotId, shouldBlockRequest, formatBotIdResult, type BotIdResult } from '../botid';
import { AppError, type ErrorResponse } from '@/shared/lib/errors';

/**
 * Bot protection middleware options
 */
interface BotProtectionOptions {
  /**
   * Whether to log bot detection events
   */
  enableLogging?: boolean;

  /**
   * Custom error message for blocked requests
   */
  blockMessage?: string;

  /**
   * Whether to include bot status in response headers (for debugging)
   */
  includeStatusHeader?: boolean;
}

/**
 * Default options for bot protection
 */
const DEFAULT_OPTIONS: Required<BotProtectionOptions> = {
  enableLogging: true,
  blockMessage: 'Access denied. Automated traffic detected.',
  includeStatusHeader: process.env.NODE_ENV !== 'production',
};

/**
 * Wraps an API route handler with bot protection
 *
 * @example
 * ```typescript
 * export const POST = withBotProtection(
 *   async (request: NextRequest) => {
 *     // Your API logic here
 *   }
 * );
 * ```
 */
export function withBotProtection<T extends unknown[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse<R>>,
  options: BotProtectionOptions = {}
) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async (request: NextRequest, ...args: T): Promise<NextResponse<R | ErrorResponse>> => {
    try {
      // Verify bot ID
      const verification = await verifyBotId();

      // Add bot status to response headers in non-production
      const headers = new Headers();
      if (config.includeStatusHeader && verification) {
        headers.set('X-Bot-Status', formatBotIdResult(verification));
        if (verification.verifiedBotName) {
          headers.set('X-Bot-Name', verification.verifiedBotName);
        }
      }

      // Check if request should be blocked
      if (shouldBlockRequest(verification)) {
        // Log blocked request
        if (config.enableLogging) {
          console.warn('[Bot Protection] Blocked request:', {
            path: request.url,
            method: request.method,
            status: formatBotIdResult(verification),
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          });
        }

        // Return 403 Forbidden for bot traffic
        return NextResponse.json(
          {
            error: config.blockMessage,
            code: 'BOT_DETECTED',
            status: 403,
          } as ErrorResponse,
          {
            status: 403,
            headers,
          }
        );
      }

      // Log verified bot traffic (for monitoring)
      if (config.enableLogging && verification?.isVerifiedBot) {
        // Using warn level for visibility in production logs
        console.warn('[Bot Protection] Verified bot allowed:', {
          path: request.url,
          method: request.method,
          botName: verification.verifiedBotName || 'Unknown',
          category: verification.verifiedBotCategory,
        });
      }

      // Call the original handler
      const response = await handler(request, ...args);

      // Add headers to successful response
      if (config.includeStatusHeader && verification) {
        response.headers.set('X-Bot-Status', formatBotIdResult(verification));
        if (verification.verifiedBotName) {
          response.headers.set('X-Bot-Name', verification.verifiedBotName);
        }
      }

      return response;
    } catch (error) {
      // Handle errors from the handler
      if (error instanceof AppError) {
        throw error;
      }

      // Log unexpected errors
      console.error('[Bot Protection] Unexpected error:', error);

      // Re-throw to let the handler's error handling take over
      throw error;
    }
  };
}

/**
 * Standalone bot verification for custom implementations
 */
export async function checkBotProtection(
  options: BotProtectionOptions = {}
): Promise<{ allowed: boolean; status: string; result: BotIdResult | null }> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  try {
    const verification = await verifyBotId();
    const shouldBlock = shouldBlockRequest(verification);
    const status = formatBotIdResult(verification);

    if (config.enableLogging && verification) {
      const logLevel = shouldBlock ? 'warn' : verification.isVerifiedBot ? 'info' : 'debug';
      const logMessage = shouldBlock ? 'Would block request' : 'Request allowed';

      const logData = {
        status,
        allowed: !shouldBlock,
        isBot: verification.isBot,
        isHuman: verification.isHuman,
        isVerifiedBot: verification.isVerifiedBot,
      };

      if (logLevel === 'warn') {
        console.warn(`[Bot Protection] ${logMessage}:`, logData);
      } else if (logLevel === 'info') {
        // Using warn for visibility, but this is informational
        console.warn(`[Bot Protection] ${logMessage}:`, logData);
      }
      // Skip debug logs to reduce noise
    }

    return {
      allowed: !shouldBlock,
      status,
      result: verification,
    };
  } catch (error) {
    // In case of error, allow the request in development, block in production
    console.error('[Bot Protection] Verification error:', error);
    return {
      allowed: process.env.NODE_ENV !== 'production',
      status: 'ERROR',
      result: null,
    };
  }
}
