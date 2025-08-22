/**
 * Centralized error handling for Grok service operations
 * Maps various error types to appropriate user-facing errors
 */

import {
  ConfigError,
  ExternalAPIError,
  NetworkError,
  RateLimitError,
  NotFoundError,
  CreditExhaustionError,
} from '@/shared/lib/errors';
import { ERROR_MESSAGES } from '../../config/grok-config';
import { createChildLogger } from '@/lib/logger';

const logger = createChildLogger('GrokErrorHandler');

/**
 * Error context for enhanced error tracking and debugging
 */
export interface ErrorContext {
  operation: string;
  username?: string;
  model?: string;
  elapsedTime?: number;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Handles error mapping and logging for Grok service operations
 */
export class GrokErrorHandler {
  /**
   * Handle errors from profile fetching operations
   * @param error - The error to handle
   * @param username - The username being fetched
   * @returns Never (always throws)
   * @throws {NotFoundError} When user is not found
   * @throws {ExternalAPIError} For other API errors
   */
  handleProfileFetchError(error: unknown, username: string): never {
    // Re-throw NotFoundError as-is
    if (error instanceof NotFoundError) {
      throw error;
    }

    // Log and wrap other errors
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        username,
        operation: 'fetchProfile',
      },
      'Failed to fetch user profile'
    );

    throw new ExternalAPIError('Grok', `Failed to fetch profile for @${username}`, error);
  }

  /**
   * Handle errors from vibe matching operations
   * @param error - The error to handle
   * @param context - Additional context about the operation
   * @returns Never (always throws)
   * @throws {ExternalAPIError} For all matching errors
   */
  handleMatchingError(error: unknown, context?: ErrorContext): never {
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context,
        operation: 'matchVibe',
      },
      'Failed to match vibes'
    );

    throw new ExternalAPIError('Grok', 'Failed to analyze compatibility', error);
  }

  /**
   * Handle errors from the main analysis operation
   * @param error - The error to handle
   * @param userOne - First username
   * @param userTwo - Second username
   * @returns Never (always throws)
   * @throws {RateLimitError} When rate limited
   * @throws {ExternalAPIError} For API errors
   * @throws {NetworkError} For network issues
   * @throws {NotFoundError} When user not found
   */
  handleAnalysisError(error: unknown, userOne: string, userTwo: string): never {
    // Re-throw known errors
    if (
      error instanceof RateLimitError ||
      error instanceof ExternalAPIError ||
      error instanceof NetworkError ||
      error instanceof NotFoundError ||
      error instanceof CreditExhaustionError
    ) {
      throw error;
    }

    // Wrap unknown errors
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        userOne,
        userTwo,
        operation: 'analyzeVibe',
      },
      'Grok service error'
    );

    throw new ExternalAPIError('Grok', ERROR_MESSAGES.ANALYSIS_FAILED, error);
  }

  /**
   * Handle configuration errors
   * @param message - Error message
   * @param field - Configuration field that's missing or invalid
   * @returns Never (always throws)
   * @throws {ConfigError} Always
   */
  handleConfigError(message: string, field: string): never {
    logger.error(
      {
        field,
        operation: 'configuration',
      },
      message
    );

    throw new ConfigError(message, field);
  }

  /**
   * Handle JSON parsing errors
   * @param error - The parsing error
   * @param content - The content that failed to parse
   * @returns Never (always throws)
   * @throws {Error} With descriptive message
   */
  handleParsingError(error: unknown, content: string): never {
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: content.length,
        operation: 'parsing',
      },
      'Failed to parse JSON response'
    );

    if (content.length > 50000) {
      throw new Error(`Response content too large: ${content.length} bytes`);
    }

    throw new Error('Failed to parse API response');
  }

  /**
   * Handle circuit breaker open state
   * @returns Never (always throws)
   * @throws {ExternalAPIError} With unavailable message
   */
  handleCircuitBreakerOpen(): never {
    logger.warn('Circuit breaker is open, rejecting request');

    throw new ExternalAPIError(
      'Grok',
      'Service temporarily unavailable due to recent failures. Please try again later.'
    );
  }

  /**
   * Log successful operation completion
   * @param operation - The operation that completed
   * @param context - Additional context to log
   */
  logSuccess(operation: string, context: Record<string, unknown>): void {
    logger.info(
      {
        operation,
        ...context,
      },
      `${operation} completed successfully`
    );
  }

  /**
   * Log operation start
   * @param operation - The operation starting
   * @param context - Additional context to log
   */
  logOperationStart(operation: string, context: Record<string, unknown>): void {
    logger.debug(
      {
        operation,
        ...context,
      },
      `Starting ${operation}`
    );
  }

  /**
   * Create an error response for API failures
   * @param error - The error to convert
   * @returns Formatted error response
   */
  createErrorResponse(error: unknown): {
    error: string;
    code: string;
    details?: string;
  } {
    if (error instanceof RateLimitError) {
      return {
        error: ERROR_MESSAGES.RATE_LIMIT,
        code: 'RATE_LIMIT_ERROR',
        details: error.retryAfter ? `Retry after ${error.retryAfter} seconds` : undefined,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        error: ERROR_MESSAGES.USER_NOT_FOUND,
        code: 'NOT_FOUND',
        details: error.message,
      };
    }

    if (error instanceof CreditExhaustionError) {
      return {
        error: ERROR_MESSAGES.CREDIT_EXHAUSTED,
        code: 'CREDIT_EXHAUSTED',
        details: error.service,
      };
    }

    if (error instanceof ConfigError) {
      return {
        error: error.message,
        code: 'CONFIG_ERROR',
        details: error.message,
      };
    }

    if (error instanceof NetworkError) {
      return {
        error: ERROR_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR',
        details: error.message,
      };
    }

    if (error instanceof ExternalAPIError) {
      return {
        error: error.message,
        code: 'EXTERNAL_API_ERROR',
        details: error.service,
      };
    }

    return {
      error: ERROR_MESSAGES.ANALYSIS_FAILED,
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
