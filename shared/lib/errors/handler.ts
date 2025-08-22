/**
 * Centralized error handler for Next.js API routes
 * Provides consistent error responses and logging
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './base.error';
import {
  ValidationError,
  InternalError,
  RateLimitError,
  NetworkError,
  NotFoundError,
  ConfigError,
} from './specific.errors';

/**
 * Error response structure for API responses
 */
export interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

/**
 * Handles errors and returns appropriate NextResponse
 * Centralizes error logic and ensures consistent responses
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Log error for monitoring (production would use proper logging service)
  logError(error);

  // Handle known AppError instances
  if (error instanceof AppError) {
    return NextResponse.json(error.toClientResponse(shouldIncludeDetails()), {
      status: error.statusCode,
    });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = ValidationError.fromZodError(error);
    return NextResponse.json(validationError.toClientResponse(shouldIncludeDetails()), {
      status: validationError.statusCode,
    });
  }

  // Handle standard errors with specific messages
  if (error instanceof Error) {
    // Check for specific error patterns
    const convertedError = convertKnownError(error);
    if (convertedError) {
      return NextResponse.json(convertedError.toClientResponse(shouldIncludeDetails()), {
        status: convertedError.statusCode,
      });
    }

    // Default to internal error for unknown errors
    // In production, never expose the original error message
    const internalError = new InternalError(
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'An internal error occurred. Please try again.',
      error
    );

    return NextResponse.json(internalError.toClientResponse(shouldIncludeDetails()), {
      status: internalError.statusCode,
    });
  }

  // Handle non-Error objects
  const unknownError = new InternalError('An unexpected error occurred', error);

  return NextResponse.json(unknownError.toClientResponse(shouldIncludeDetails()), {
    status: unknownError.statusCode,
  });
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
  if (message.includes('network_error') || error.name === 'AbortError') {
    return new NetworkError('external service', error);
  }

  // Not found patterns
  if (message.includes('not_found') || message.includes('not found')) {
    return new NotFoundError('Resource');
  }

  // Config error patterns
  if (message.includes('config') || message.includes('missing')) {
    return new ConfigError(error.message);
  }

  return null;
}

/**
 * Logs errors with appropriate context and security filtering
 * Ensures no sensitive information is logged in production
 */
function logError(error: unknown): void {
  const isProduction = process.env.NODE_ENV === 'production';

  if (error instanceof AppError) {
    // Operational errors - expected failures
    if (error.isOperational) {
      console.error(
        `[${error.code}] ${error.message}`,
        isProduction ? sanitizeMetadata(error.metadata) : error.metadata
      );
    } else {
      // Programming errors - unexpected failures
      console.error('Unexpected error:', error.message);
      if (!isProduction) {
        console.error('Stack:', error.stack);
        console.error('Metadata:', error.metadata);
      }
    }
  } else if (error instanceof Error) {
    console.error('Unhandled error:', error.message);
    if (!isProduction) {
      console.error('Stack:', error.stack);
    }
  } else {
    console.error('Unknown error type occurred');
    if (!isProduction) {
      console.error('Error details:', error);
    }
  }
}

/**
 * Sanitizes metadata object to remove sensitive information for production logging
 */
function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata) return {};

  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['apiKey', 'password', 'token', 'secret', 'authorization', 'auth'];

  for (const [key, value] of Object.entries(metadata)) {
    const keyLower = key.toLowerCase();

    if (sensitiveKeys.some((sensitive) => keyLower.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 100) {
      // Truncate long strings that might contain sensitive data
      sanitized[key] = value.substring(0, 100) + '... [TRUNCATED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Determines whether to include error details in response
 * Production environment removes sensitive information
 */
function shouldIncludeDetails(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Creates a standardized error response for successful operations
 * that still need to communicate warnings or partial failures
 */
export function createWarningResponse<T>(
  data: T,
  warning: string,
  statusCode = 200
): NextResponse<T & { warning: string }> {
  return NextResponse.json({ ...data, warning }, { status: statusCode });
}
