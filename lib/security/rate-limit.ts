import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getRedisConfig, getRateLimitConfig, isRateLimitEnabled } from '@/lib/env';
import { RateLimitError } from '@/shared/lib/errors/specific.errors';

/**
 * Rate limit result with metadata
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
  /**
   * Custom identifier extractor (default: IP address)
   */
  identifier?: (request: Request) => string;
  /**
   * Custom error message
   */
  errorMessage?: string;
  /**
   * Analytics tracking
   */
  analytics?: boolean;
  /**
   * Cache prefix for Redis keys
   */
  prefix?: string;
}

/**
 * Extract client IP address from request headers
 * Handles various proxy configurations
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Check common proxy headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback to a default identifier
  return 'anonymous';
}

/**
 * Create a rate limiter instance
 * Returns null if rate limiting is disabled or Redis is not configured
 */
export function createRateLimiter(config?: RateLimiterConfig): Ratelimit | null {
  if (!isRateLimitEnabled()) {
    return null;
  }

  const redisConfig = getRedisConfig();
  if (!redisConfig) {
    console.warn('[Rate Limit] Redis not configured, rate limiting disabled');
    return null;
  }

  const rateLimitConfig = getRateLimitConfig();

  try {
    const redis = new Redis({
      url: redisConfig.url,
      token: redisConfig.token,
    });

    // Using token bucket for burst tolerance
    // This allows users to make bursts of requests but controls the average rate
    return new Ratelimit({
      redis,
      limiter: Ratelimit.tokenBucket(
        rateLimitConfig.maxRequests,
        `${rateLimitConfig.windowMinutes}m`,
        rateLimitConfig.refillRate
      ),
      analytics: config?.analytics ?? true,
      prefix: config?.prefix ?? '@matchvibe/ratelimit',
      // Enable ephemeral cache for performance
      ephemeralCache: new Map(),
    });
  } catch (error) {
    console.error('[Rate Limit] Failed to initialize rate limiter:', error);
    return null;
  }
}

/**
 * Check rate limit for a request
 * @param request - The incoming request
 * @param config - Optional configuration
 * @returns Rate limit result with metadata
 */
export async function checkRateLimit(
  request: Request,
  config?: RateLimiterConfig
): Promise<RateLimitResult> {
  const rateLimiter = createRateLimiter(config);

  // If rate limiting is disabled, always allow
  if (!rateLimiter) {
    const rateLimitConfig = getRateLimitConfig();
    return {
      success: true,
      limit: rateLimitConfig.maxRequests,
      remaining: rateLimitConfig.maxRequests,
      reset: Date.now() + rateLimitConfig.windowMinutes * 60 * 1000,
    };
  }

  try {
    // Get identifier (IP address by default)
    const identifier = config?.identifier ? config.identifier(request) : getClientIp(request);

    // Check rate limit
    const result = await rateLimiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    // Log error but don't block requests if rate limiting fails
    console.error('[Rate Limit] Check failed:', error);

    // In case of error, be permissive in development, strict in production
    const isDev = process.env.NODE_ENV === 'development';
    const rateLimitConfig = getRateLimitConfig();

    return {
      success: isDev,
      limit: rateLimitConfig.maxRequests,
      remaining: isDev ? rateLimitConfig.maxRequests : 0,
      reset: Date.now() + rateLimitConfig.windowMinutes * 60 * 1000,
      retryAfter: isDev ? undefined : 60,
    };
  }
}

/**
 * Format rate limit headers for response
 */
export function formatRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();

  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

  if (!result.success && result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }

  return headers;
}

/**
 * Create a rate limit error response
 */
export function createRateLimitError(
  result: RateLimitResult,
  customMessage?: string
): RateLimitError {
  const retryAfter = result.retryAfter || 60;

  const message =
    customMessage ||
    `Rate limit exceeded. You've made too many requests. Please wait ${retryAfter} seconds before trying again.`;

  return new RateLimitError(message, retryAfter, {
    limit: result.limit,
    remaining: 0,
    reset: new Date(result.reset).toISOString(),
  });
}
