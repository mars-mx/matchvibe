/**
 * Error handler for server actions
 * Converts various error types to FormState format
 * Mirrors the pattern from shared/lib/errors but for server actions
 */

import { ZodError } from 'zod';
import { AppError, isAppError } from '@/shared/lib/errors';
import { ValidationError, RateLimitError, NetworkError, ConfigError } from '@/shared/lib/errors';
import type { FormState } from '@/features/vibe-analysis/actions/analyze.action';

/**
 * Handles errors in server actions and returns appropriate FormState
 * Provides consistent error responses for form submissions
 */
export function handleActionError(error: unknown): FormState {
  // Log error for monitoring
  logActionError(error);

  // Handle known AppError instances
  if (isAppError(error)) {
    return convertAppErrorToFormState(error);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = ValidationError.fromZodError(error);
    return convertAppErrorToFormState(validationError);
  }

  // Handle standard errors with specific messages
  if (error instanceof Error) {
    // Check for specific error patterns
    const convertedError = convertKnownError(error);
    if (convertedError) {
      return convertAppErrorToFormState(convertedError);
    }

    // Default to generic error message
    return {
      success: false,
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An error occurred while analyzing compatibility. Please try again.',
    };
  }

  // Handle non-Error objects
  return {
    success: false,
    message: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Converts AppError instances to FormState format
 */
function convertAppErrorToFormState(error: AppError): FormState {
  switch (error.code) {
    case 'RATE_LIMIT_ERROR':
      return {
        success: false,
        message: 'Too many requests. Please wait a moment and try again.',
      };

    case 'VALIDATION_ERROR':
      // Extract field-specific errors if available
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors) {
        return {
          success: false,
          errors: fieldErrors,
        };
      }
      return {
        success: false,
        errors: {
          general: [error.message],
        },
      };

    case 'CONFIG_ERROR':
      return {
        success: false,
        message: 'Service is temporarily unavailable. Please try again later.',
      };

    case 'NETWORK_ERROR':
    case 'EXTERNAL_API_ERROR':
      return {
        success: false,
        message: 'Failed to connect to analysis service. Please try again.',
      };

    case 'NOT_FOUND':
      return {
        success: false,
        errors: {
          general: ['One or both usernames could not be found'],
        },
      };

    default:
      return {
        success: false,
        message: error.message || 'An error occurred during analysis',
      };
  }
}

/**
 * Extracts field-specific errors from AppError metadata
 */
function extractFieldErrors(error: AppError): FormState['errors'] | null {
  if (!error.metadata?.fieldErrors) {
    return null;
  }

  const fieldErrors = error.metadata.fieldErrors as Record<string, string[]>;
  const errors: FormState['errors'] = {};

  if (fieldErrors.userOne) {
    errors.userOne = fieldErrors.userOne;
  }
  if (fieldErrors.userTwo) {
    errors.userTwo = fieldErrors.userTwo;
  }
  if (fieldErrors.general || fieldErrors._errors) {
    errors.general = fieldErrors.general || fieldErrors._errors;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Converts known error patterns to AppError instances
 * Provides backward compatibility with existing error handling
 */
function convertKnownError(error: Error): AppError | null {
  const message = error.message.toLowerCase();

  // Rate limit patterns
  if (message.includes('rate_limit') || message.includes('rate limit')) {
    return new RateLimitError();
  }

  // Network error patterns
  if (
    message.includes('network_error') ||
    message.includes('fetch failed') ||
    error.name === 'AbortError'
  ) {
    return new NetworkError('Grok API', error);
  }

  // Config error patterns
  if (
    message.includes('grok_api_key') ||
    message.includes('api key') ||
    message.includes('configuration')
  ) {
    return new ConfigError('Service configuration error');
  }

  return null;
}

/**
 * Logs errors with appropriate context for server actions
 */
function logActionError(error: unknown): void {
  const isDev = process.env.NODE_ENV === 'development';

  if (isAppError(error)) {
    // Operational errors - expected failures
    if (error.isOperational) {
      console.error(`[Server Action] ${error.code}: ${error.message}`);
      if (isDev && error.metadata) {
        console.error('Metadata:', error.metadata);
      }
    } else {
      // Programming errors - unexpected failures
      console.error('[Server Action] Unexpected error:', error.message);
      if (isDev) {
        console.error('Stack:', error.stack);
        console.error('Metadata:', error.metadata);
      }
    }
  } else if (error instanceof Error) {
    console.error('[Server Action] Unhandled error:', error.message);
    if (isDev) {
      console.error('Stack:', error.stack);
    }
  } else {
    console.error('[Server Action] Unknown error type');
    if (isDev) {
      console.error('Error details:', error);
    }
  }
}
