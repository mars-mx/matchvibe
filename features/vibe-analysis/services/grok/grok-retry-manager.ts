/**
 * Retry manager for Grok API with support for Retry-After headers
 * Implements exponential backoff with jitter and respects server rate limit headers
 */

import pRetry, { AbortError } from 'p-retry';
import { createChildLogger } from '@/lib/logger';
import { validateEnv } from '@/lib/validations/env.schema';

const logger = createChildLogger('GrokRetryManager');
const env = validateEnv();

export interface RetryOptions {
  maxAttempts?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
  randomize?: boolean;
  respectRetryAfter?: boolean;
  retryAfterMax?: number;
}

export interface RetryContext {
  attempt: number;
  retriesLeft: number;
  error: Error;
  retryAfterMs?: number;
}

/**
 * Manages retry logic for Grok API requests with intelligent backoff
 *
 * Features:
 * - Exponential backoff with configurable parameters
 * - Respects Retry-After and X-RateLimit-Reset headers
 * - Jitter to prevent thundering herd
 * - Configurable via environment variables
 *
 * @example
 * ```typescript
 * const retryManager = new GrokRetryManager();
 * const response = await retryManager.retryWithBackoff(
 *   () => fetch(url, options),
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export class GrokRetryManager {
  private retryAfterDelay: number | null = null;

  /**
   * Execute a function with automatic retry logic
   * @param fn - Function that returns a Response promise
   * @param options - Optional retry configuration
   * @returns Response from successful request
   * @throws {AbortError} When max retries exceeded or non-retryable error
   */
  async retryWithBackoff(fn: () => Promise<Response>, options?: RetryOptions): Promise<Response> {
    const config = this.buildConfig(options);

    return pRetry(
      async () => {
        const response = await fn();

        // Check for rate limiting
        if (response.status === 429) {
          // Parse rate limit headers
          this.extractRetryDelay(response);

          logger.warn(
            {
              status: 429,
              retryAfter: this.retryAfterDelay,
              headers: {
                'retry-after': response.headers.get('retry-after'),
                'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
                'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
                'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
              },
            },
            'Rate limited by Grok API'
          );

          throw new Error('Rate limited');
        }

        // Check for server errors that should be retried
        if (response.status >= 500 && response.status < 600) {
          logger.warn(
            {
              status: response.status,
              statusText: response.statusText,
            },
            'Server error, will retry'
          );

          throw new Error(`Server error: ${response.status}`);
        }

        // Don't retry client errors (except 429)
        if (response.status >= 400 && response.status < 500) {
          throw new AbortError(`Client error: ${response.status} - not retrying`);
        }

        // Reset delay on success
        this.retryAfterDelay = null;
        return response;
      },
      {
        retries: config.maxAttempts,
        minTimeout: config.minTimeout,
        maxTimeout: config.maxTimeout,
        factor: config.factor,
        randomize: config.randomize,

        onFailedAttempt: async (error) => {
          const context: RetryContext = {
            attempt: error.attemptNumber,
            retriesLeft: error.retriesLeft,
            error: error as Error,
            retryAfterMs: this.retryAfterDelay ?? undefined,
          };

          // Use server-specified delay if available and respected
          if (this.retryAfterDelay && config.respectRetryAfter) {
            const delayMs = Math.min(this.retryAfterDelay, config.retryAfterMax);

            logger.info(
              {
                ...context,
                delayMs,
                source: 'retry-after-header',
              },
              `Respecting Retry-After header: waiting ${delayMs}ms`
            );

            await this.delay(delayMs);
            this.retryAfterDelay = null; // Reset after use
          }

          logger.warn(context, 'Retry attempt failed');
        },

        shouldRetry: (error) => {
          // Don't retry on abort errors
          if (error instanceof AbortError) {
            return false;
          }

          // Don't retry on network errors after too many attempts
          if (error instanceof TypeError && error.message.includes('fetch')) {
            logger.error({ error: error.message }, 'Network error during retry');
            return true; // Let p-retry handle max attempts
          }

          return true;
        },
      }
    );
  }

  /**
   * Extract retry delay from response headers
   * Supports both Retry-After and X-RateLimit-Reset headers
   */
  private extractRetryDelay(response: Response): void {
    // Try Retry-After header first (standard)
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) {
      this.retryAfterDelay = this.parseRetryAfter(retryAfter);
      return;
    }

    // Try X-RateLimit-Reset header (common in APIs)
    const rateLimitReset = response.headers.get('x-ratelimit-reset');
    if (rateLimitReset) {
      this.retryAfterDelay = this.parseRateLimitReset(rateLimitReset);
      return;
    }

    // Try X-RateLimit-Reset-After (some APIs use this)
    const resetAfter = response.headers.get('x-ratelimit-reset-after');
    if (resetAfter) {
      this.retryAfterDelay = this.parseRetryAfter(resetAfter);
      return;
    }

    // No retry delay found
    this.retryAfterDelay = null;
  }

  /**
   * Parse Retry-After header value
   * @param retryAfter - Header value (seconds or HTTP date)
   * @returns Delay in milliseconds
   */
  private parseRetryAfter(retryAfter: string): number {
    // Check if it's a number (seconds)
    const seconds = Number(retryAfter);
    if (!isNaN(seconds)) {
      return Math.max(0, seconds * 1000); // Convert to milliseconds
    }

    // Otherwise, try to parse as HTTP date
    try {
      const retryDate = new Date(retryAfter);
      const now = new Date();
      return Math.max(0, retryDate.getTime() - now.getTime());
    } catch {
      logger.warn({ retryAfter }, 'Failed to parse Retry-After header');
      return 0;
    }
  }

  /**
   * Parse X-RateLimit-Reset header value
   * @param resetTime - Unix timestamp (seconds or milliseconds)
   * @returns Delay in milliseconds
   */
  private parseRateLimitReset(resetTime: string): number {
    const resetTimestamp = Number(resetTime);
    if (isNaN(resetTimestamp)) {
      logger.warn({ resetTime }, 'Failed to parse X-RateLimit-Reset header');
      return 0;
    }

    // Check if it's Unix timestamp in seconds (< 10 billion) or milliseconds
    const resetMs = resetTimestamp < 10000000000 ? resetTimestamp * 1000 : resetTimestamp;

    const now = Date.now();
    const delay = Math.max(0, resetMs - now);

    // Add a small buffer to account for clock differences
    return delay > 0 ? delay + 1000 : 0;
  }

  /**
   * Build configuration from options and environment
   */
  private buildConfig(options?: RetryOptions): Required<RetryOptions> {
    return {
      maxAttempts: options?.maxAttempts ?? env.GROK_RETRY_MAX_ATTEMPTS,
      minTimeout: options?.minTimeout ?? env.GROK_RETRY_MIN_TIMEOUT_MS,
      maxTimeout: options?.maxTimeout ?? env.GROK_RETRY_MAX_TIMEOUT_MS,
      factor: options?.factor ?? env.GROK_RETRY_FACTOR,
      randomize: options?.randomize ?? env.GROK_RETRY_RANDOMIZE,
      respectRetryAfter: options?.respectRetryAfter ?? env.GROK_RESPECT_RETRY_AFTER,
      retryAfterMax: options?.retryAfterMax ?? env.GROK_RETRY_AFTER_MAX_MS,
    };
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is retryable
   */
  static isRetryableError(error: unknown): boolean {
    if (error instanceof AbortError) {
      return false;
    }

    if (error instanceof Error) {
      // Network errors are retryable
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return true;
      }

      // Rate limit errors are retryable
      if (error.message.includes('rate') || error.message.includes('429')) {
        return true;
      }

      // Server errors are retryable
      if (
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504')
      ) {
        return true;
      }
    }

    return false;
  }
}
