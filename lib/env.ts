/**
 * Centralized environment configuration with fail-fast validation
 * Validates environment variables at startup to prevent runtime failures
 */

import { validateEnv, type Env } from '@/lib/validations/env.schema';
import { ConfigError } from '@/shared/lib/errors';

// Validate environment at module load time - fail fast on startup
let env: Env;

try {
  env = validateEnv();
} catch (error) {
  // Log the error and exit the process in production
  console.error('Critical: Environment validation failed:', error);

  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }

  // Re-throw for development/test environments
  throw error;
}

/**
 * Get validated environment configuration
 * @returns Validated environment object
 */
export function getEnv(): Env {
  return env;
}

/**
 * Get Grok API key with runtime safety check
 * @returns Validated Grok API key
 * @throws ConfigError if key is not available
 */
export function getGrokApiKey(): string {
  const key = env.GROK_API_KEY;
  if (!key) {
    throw new ConfigError(
      'Grok API service is unavailable. Please contact support.',
      'GROK_API_KEY_MISSING'
    );
  }
  return key;
}

/**
 * Get Grok model version
 * @returns Configured model version
 */
export function getGrokModelVersion(): string {
  return env.GROK_MODEL_VERSION;
}

/**
 * Get log level
 * @returns Configured log level
 */
export function getLogLevel(): string {
  return env.LOG_LEVEL;
}

/**
 * Check if we're in development mode
 * @returns True if NODE_ENV is development
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * Check if we're in production mode
 * @returns True if NODE_ENV is production
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Check if we're in test mode
 * @returns True if NODE_ENV is test
 */
export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

/**
 * Get Upstash Redis configuration
 * @returns Redis config or null if not configured
 */
export function getRedisConfig(): { url: string; token: string } | null {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    };
  }
  return null;
}

/**
 * Get rate limiting configuration
 * @returns Rate limit configuration
 */
export function getRateLimitConfig() {
  return {
    enabled: env.RATE_LIMIT_ENABLED,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    windowMinutes: env.RATE_LIMIT_WINDOW_MINUTES,
    refillRate: env.RATE_LIMIT_REFILL_RATE,
    burstCapacity: env.RATE_LIMIT_BURST_CAPACITY,
  };
}

/**
 * Check if rate limiting is enabled
 * @returns True if rate limiting is enabled
 */
export function isRateLimitEnabled(): boolean {
  return env.RATE_LIMIT_ENABLED && !!getRedisConfig();
}
