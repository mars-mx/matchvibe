/**
 * Centralized environment configuration with runtime validation
 * Validates environment variables only at runtime, not during build
 */

import { validateEnv, type Env } from '@/lib/validations/env.schema';
import { ConfigError } from '@/shared/lib/errors';

// Cache for validated environment - lazy loaded
let env: Env | null = null;
let validationError: Error | null = null;

/**
 * Check if we're in the build phase
 * @returns True if currently building
 */
function isBuildTime(): boolean {
  // Only return true during actual Next.js build phase
  // NEXT_PHASE is only set during build, not at runtime
  return process.env.NEXT_PHASE === 'phase-production-build';
}

/**
 * Get validated environment configuration
 * Uses lazy loading to avoid validation during build time
 * @returns Validated environment object
 */
export function getEnv(): Env {
  // Skip validation during build time - return defaults
  if (isBuildTime()) {
    return createBuildTimeEnv();
  }

  // If we already have a validation error, throw it
  if (validationError) {
    throw validationError;
  }

  // Lazy load and validate environment only at runtime
  if (!env) {
    try {
      env = validateEnv();
    } catch (error) {
      validationError = error as Error;
      // Log the error
      console.error('Critical: Environment validation failed:', error);

      // In production, we still throw but with a more user-friendly message
      if (process.env.NODE_ENV === 'production') {
        throw new ConfigError(
          'Service configuration error. Please try again later.',
          'ENV_RUNTIME_ERROR'
        );
      }

      // Re-throw original error in development
      throw error;
    }
  }

  return env;
}

/**
 * Create minimal environment for build time
 * Returns safe defaults that won't break the build
 */
function createBuildTimeEnv(): Env {
  return {
    // Core settings with safe defaults
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'test' | 'production',
    GROK_API_KEY: 'build-time-placeholder',
    GROK_MODEL_VERSION: 'grok-4-0709',
    GROK_MAX_TOKENS: 10000,
    LOG_LEVEL: 'info' as const,

    // Optional settings with defaults
    NEXT_PUBLIC_API_KEY: undefined,

    // Grok rate limiting defaults
    GROK_RATE_LIMIT_GPT4_RPM: 480,
    GROK_RATE_LIMIT_GPT3_RPM: 600,
    GROK_RATE_LIMIT_GPT3_MINI_RPM: 480,
    GROK_THROTTLE_INTERVAL_MS: 60000,
    GROK_THROTTLE_STRICT_MODE: false,

    // Grok retry defaults
    GROK_RETRY_MAX_ATTEMPTS: 5,
    GROK_RETRY_MIN_TIMEOUT_MS: 1000,
    GROK_RETRY_MAX_TIMEOUT_MS: 60000,
    GROK_RETRY_FACTOR: 2,
    GROK_RETRY_RANDOMIZE: true,
    GROK_RESPECT_RETRY_AFTER: true,
    GROK_RETRY_AFTER_MAX_MS: 120000,

    // Vibe scoring defaults
    VIBE_AMPLIFICATION_POWER: 2.5,
  } as Env;
}

/**
 * Get Grok API key with runtime safety check
 * @returns Validated Grok API key
 * @throws ConfigError if key is not available
 */
export function getGrokApiKey(): string {
  const environment = getEnv();
  const key = environment.GROK_API_KEY;

  // Check if it's still the build placeholder
  if (!key || key === 'build-time-placeholder') {
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
  return getEnv().GROK_MODEL_VERSION;
}

/**
 * Get Grok max tokens
 * @returns Configured maximum tokens for Grok responses
 */
export function getGrokMaxTokens(): number {
  return getEnv().GROK_MAX_TOKENS;
}

/**
 * Get log level
 * @returns Configured log level
 */
export function getLogLevel(): string {
  return getEnv().LOG_LEVEL;
}

/**
 * Check if we're in development mode
 * @returns True if NODE_ENV is development
 */
export function isDevelopment(): boolean {
  // For build time, check process.env directly
  if (isBuildTime()) {
    return process.env.NODE_ENV !== 'production';
  }
  return getEnv().NODE_ENV === 'development';
}

/**
 * Check if we're in production mode
 * @returns True if NODE_ENV is production
 */
export function isProduction(): boolean {
  // For build time, check process.env directly
  if (isBuildTime()) {
    return process.env.NODE_ENV === 'production';
  }
  return getEnv().NODE_ENV === 'production';
}

/**
 * Check if we're in test mode
 * @returns True if NODE_ENV is test
 */
export function isTest(): boolean {
  // For build time, check process.env directly
  if (isBuildTime()) {
    return process.env.NODE_ENV === 'test';
  }
  return getEnv().NODE_ENV === 'test';
}

/**
 * Get vibe amplification power for score calculation
 * @returns Amplification power (1-5, default 2.5)
 */
export function getVibeAmplificationPower(): number {
  return getEnv().VIBE_AMPLIFICATION_POWER;
}
