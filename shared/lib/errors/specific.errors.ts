/**
 * Specific error classes for different failure scenarios
 * Each class encapsulates its error type, status code, and context
 */

import { AppError, type ErrorMetadata } from './base.error';
import { ZodError } from 'zod';

/**
 * Validation errors for invalid input data
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    metadata?: ErrorMetadata & {
      field?: string;
      value?: unknown;
      errors?: Array<{ field: string; message: string }>;
    }
  ) {
    super(message, 'VALIDATION_ERROR', 400, true, metadata);
  }

  /**
   * Creates a ValidationError from a Zod error
   */
  static fromZodError(error: ZodError<unknown>): ValidationError {
    const errors = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    const message =
      errors.length === 1 ? errors[0].message : `Validation failed: ${errors.length} errors`;

    return new ValidationError(message, { errors });
  }
}

/**
 * Rate limiting errors for API throttling
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number, metadata?: ErrorMetadata) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, {
      ...metadata,
      retryAfter,
    });
    this.retryAfter = retryAfter;
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string, metadata?: ErrorMetadata) {
    const message = identifier ? `${resource} '${identifier}' not found` : `${resource} not found`;

    super(message, 'NOT_FOUND', 404, true, {
      ...metadata,
      resource,
      identifier,
    });
  }
}

/**
 * Configuration errors for missing or invalid config
 */
export class ConfigError extends AppError {
  constructor(message: string, configKey?: string, metadata?: ErrorMetadata) {
    super(message, 'CONFIG_ERROR', 500, false, {
      ...metadata,
      configKey,
    });
  }
}

/**
 * External API errors for third-party service failures
 */
export class ExternalAPIError extends AppError {
  public readonly service: string;
  public readonly originalError?: unknown;

  constructor(
    service: string,
    message: string,
    originalError?: unknown,
    statusCode = 503,
    metadata?: ErrorMetadata
  ) {
    super(message, 'EXTERNAL_API_ERROR', statusCode, true, {
      ...metadata,
      service,
      originalError:
        originalError instanceof Error
          ? {
              name: originalError.name,
              message: originalError.message,
            }
          : originalError,
    });
    this.service = service;
    this.originalError = originalError;
  }

  /**
   * Creates an ExternalAPIError from a fetch response
   */
  static async fromResponse(
    service: string,
    response: Response,
    context?: string
  ): Promise<ExternalAPIError> {
    let errorBody: unknown = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorBody = await response.json();
      } else {
        errorBody = await response.text();
      }
    } catch {
      // Failed to parse error body
    }

    const message = context
      ? `${service} error in ${context}: ${response.status} ${response.statusText}`
      : `${service} error: ${response.status} ${response.statusText}`;

    return new ExternalAPIError(service, message, errorBody, response.status === 429 ? 429 : 503, {
      httpStatus: response.status,
      httpStatusText: response.statusText,
      errorBody,
    });
  }
}

/**
 * Network errors for connectivity issues
 */
export class NetworkError extends AppError {
  constructor(service: string, originalError?: unknown, metadata?: ErrorMetadata) {
    const message = `Network error connecting to ${service}`;

    super(message, 'NETWORK_ERROR', 503, true, {
      ...metadata,
      service,
      originalError:
        originalError instanceof Error
          ? {
              name: originalError.name,
              message: originalError.message,
            }
          : originalError,
    });
  }
}

/**
 * Credit or quota exhaustion errors for billing-related failures
 */
export class CreditExhaustionError extends AppError {
  public readonly service: string;

  constructor(service: string, message?: string, metadata?: ErrorMetadata) {
    const defaultMessage = `${service} credits/tokens have been exhausted. Please contact marsc_hb or richkuo7 to top up.`;
    
    super(message || defaultMessage, 'CREDIT_EXHAUSTION', 402, true, {
      ...metadata,
      service,
      requiresManualIntervention: true,
      contacts: ['marsc_hb', 'richkuo7'],
    });
    
    this.service = service;
  }
}

/**
 * Internal server errors for unexpected failures
 */
export class InternalError extends AppError {
  constructor(
    message = 'An unexpected error occurred',
    originalError?: unknown,
    metadata?: ErrorMetadata
  ) {
    super(message, 'INTERNAL_ERROR', 500, false, {
      ...metadata,
      originalError:
        originalError instanceof Error
          ? {
              name: originalError.name,
              message: originalError.message,
              stack: process.env.NODE_ENV === 'development' ? originalError.stack : undefined,
            }
          : originalError,
    });
  }
}
