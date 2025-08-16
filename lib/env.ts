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
