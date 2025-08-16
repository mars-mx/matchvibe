import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  formatRateLimitHeaders,
  createRateLimitError,
  type RateLimitResult,
} from '../rate-limit';
import { handleApiError, type ErrorResponse } from '@/shared/lib/errors';

/**
 * Rate limit middleware options
 */
interface RateLimitMiddlewareOptions {
  /**
   * Custom identifier extractor (default: IP address)
   */
  identifier?: (request: NextRequest) => string;

  /**
   * Whether to log rate limit events
   */
  enableLogging?: boolean;

  /**
   * Custom error message for rate limited requests
   */
  errorMessage?: string;

  /**
   * Whether to include rate limit headers in all responses
   */
  includeHeaders?: boolean;

  /**
   * Skip rate limiting for certain conditions
   */
  skip?: (request: NextRequest) => boolean | Promise<boolean>;
}

/**
 * Default options for rate limit middleware
 */
const DEFAULT_OPTIONS: Required<Omit<RateLimitMiddlewareOptions, 'identifier' | 'skip'>> = {
  enableLogging: true,
  errorMessage: undefined as any, // Will use default from createRateLimitError
  includeHeaders: true,
};

/**
 * Wraps an API route handler with rate limiting
 * This should be applied BEFORE any expensive operations like bot protection
 *
 * @example
 * ```typescript
 * // Rate limiting runs first (cheap), then bot protection (expensive)
 * export const POST = withRateLimit(
 *   withBotProtection(
 *     async (request: NextRequest) => {
 *       // Your API logic here
 *     }
 *   )
 * );
 * ```
 */
export function withRateLimit<T extends unknown[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse<R>>,
  options: RateLimitMiddlewareOptions = {}
) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async (request: NextRequest, ...args: T): Promise<NextResponse<R | ErrorResponse>> => {
    try {
      // Check if rate limiting should be skipped
      if (options.skip) {
        const shouldSkip = await options.skip(request);
        if (shouldSkip) {
          return handler(request, ...args);
        }
      }

      // Convert NextRequest to standard Request for rate limit check
      const standardRequest = new Request(request.url, {
        headers: request.headers,
        method: request.method,
      });

      // Check rate limit
      const result = await checkRateLimit(standardRequest, {
        identifier: options.identifier ? () => options.identifier!(request) : undefined,
        errorMessage: config.errorMessage,
      });

      // Log rate limit event if enabled
      if (config.enableLogging) {
        logRateLimitEvent(request, result);
      }

      // If rate limited, return error response
      if (!result.success) {
        const error = createRateLimitError(result, config.errorMessage);
        const errorResponse = handleApiError(error);

        // Add rate limit headers to error response
        if (config.includeHeaders) {
          const rateLimitHeaders = formatRateLimitHeaders(result);
          rateLimitHeaders.forEach((value, key) => {
            errorResponse.headers.set(key, value);
          });
        }

        return errorResponse as NextResponse<ErrorResponse>;
      }

      // Call the original handler
      const response = await handler(request, ...args);

      // Add rate limit headers to successful response
      if (config.includeHeaders) {
        const rateLimitHeaders = formatRateLimitHeaders(result);
        rateLimitHeaders.forEach((value, key) => {
          response.headers.set(key, value);
        });
      }

      return response;
    } catch (error) {
      // If rate limiting itself fails, log but don't block the request in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[Rate Limit Middleware] Unexpected error:', error);
        return handler(request, ...args);
      }

      // In production, treat rate limit failures as errors
      return handleApiError(error) as NextResponse<ErrorResponse>;
    }
  };
}

/**
 * Log rate limit events for monitoring
 */
function logRateLimitEvent(request: NextRequest, result: RateLimitResult): void {
  const logData = {
    path: request.url,
    method: request.method,
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    userAgent: request.headers.get('user-agent'),
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown',
  };

  if (!result.success) {
    console.warn('[Rate Limit] Request blocked:', {
      ...logData,
      retryAfter: result.retryAfter,
      reset: new Date(result.reset).toISOString(),
    });
  } else if (result.remaining <= 5) {
    // Warn when approaching limit
    console.warn('[Rate Limit] Approaching limit:', logData);
  }
}

/**
 * Standalone rate limit check for custom implementations
 * Useful for checking rate limits without blocking requests
 */
export async function checkRateLimitStatus(
  request: NextRequest,
  options?: RateLimitMiddlewareOptions
): Promise<{ allowed: boolean; result: RateLimitResult }> {
  try {
    // Convert NextRequest to standard Request
    const standardRequest = new Request(request.url, {
      headers: request.headers,
      method: request.method,
    });

    const result = await checkRateLimit(standardRequest, {
      identifier: options?.identifier ? () => options.identifier!(request) : undefined,
    });

    if (options?.enableLogging) {
      logRateLimitEvent(request, result);
    }

    return {
      allowed: result.success,
      result,
    };
  } catch (error) {
    console.error('[Rate Limit] Status check failed:', error);

    // On error, be permissive in development
    const isDev = process.env.NODE_ENV === 'development';
    return {
      allowed: isDev,
      result: {
        success: isDev,
        limit: 20,
        remaining: isDev ? 20 : 0,
        reset: Date.now() + 600000,
        retryAfter: isDev ? undefined : 60,
      },
    };
  }
}
