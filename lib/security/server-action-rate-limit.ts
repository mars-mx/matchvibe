import { headers } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getRedisConfig, getRateLimitConfig, isRateLimitEnabled } from '@/lib/env';

/**
 * Rate limit result for server actions
 */
export interface ServerActionRateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Get client identifier from Next.js headers
 */
async function getClientIdentifier(): Promise<string> {
  const headersList = await headers();

  // Try to get the real IP from various headers
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const vercelIp = headersList.get('x-vercel-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (vercelIp) {
    return vercelIp;
  }

  // Fallback to a generic identifier
  return 'anonymous';
}

/**
 * Check rate limit for server actions
 * @param customIdentifier - Optional custom identifier, defaults to IP from headers
 * @returns Rate limit result or success if rate limiting is disabled
 */
export async function checkServerActionRateLimit(
  customIdentifier?: string
): Promise<ServerActionRateLimitResult> {
  // If rate limiting is disabled, always return success
  if (!isRateLimitEnabled()) {
    const rateLimitConfig = getRateLimitConfig();
    return {
      success: true,
      limit: rateLimitConfig.maxRequests,
      remaining: rateLimitConfig.maxRequests,
      reset: Date.now() + rateLimitConfig.windowMinutes * 60 * 1000,
    };
  }

  const redisConfig = getRedisConfig();
  if (!redisConfig) {
    // No Redis configured, allow the request
    const rateLimitConfig = getRateLimitConfig();
    return {
      success: true,
      limit: rateLimitConfig.maxRequests,
      remaining: rateLimitConfig.maxRequests,
      reset: Date.now() + rateLimitConfig.windowMinutes * 60 * 1000,
    };
  }

  try {
    const rateLimitConfig = getRateLimitConfig();

    const redis = new Redis({
      url: redisConfig.url,
      token: redisConfig.token,
    });

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        rateLimitConfig.maxRequests,
        `${rateLimitConfig.windowMinutes} m`
      ),
      analytics: true,
      prefix: 'vibe-action',
    });

    // Get identifier
    const identifier = customIdentifier || (await getClientIdentifier());

    // Check rate limit
    const result = await ratelimit.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Server action rate limit check failed:', error);
    // On error, allow the request but log it
    const rateLimitConfig = getRateLimitConfig();
    return {
      success: true,
      limit: rateLimitConfig.maxRequests,
      remaining: rateLimitConfig.maxRequests,
      reset: Date.now() + rateLimitConfig.windowMinutes * 60 * 1000,
    };
  }
}

/**
 * Wrapper for server actions with rate limiting
 * @param action - The server action to wrap
 * @param options - Options for rate limiting
 * @returns Wrapped action with rate limiting
 */
export function withServerActionRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  action: T,
  options?: {
    errorMessage?: string;
    getIdentifier?: (...args: Parameters<T>) => string | Promise<string>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    // Get custom identifier if provided
    const identifier = options?.getIdentifier ? await options.getIdentifier(...args) : undefined;

    // Check rate limit
    const rateLimitResult = await checkServerActionRateLimit(identifier);

    if (!rateLimitResult.success) {
      const errorMessage =
        options?.errorMessage || 'Too many requests. Please wait before trying again.';

      // Return error in the expected format for form actions
      return {
        success: false,
        message: errorMessage,
        errors: {
          general: [errorMessage],
        },
      };
    }

    // Execute the original action
    return action(...args);
  }) as T;
}
