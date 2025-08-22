/**
 * Base error class for application-specific errors
 * Provides consistent error structure and type safety
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'NOT_FOUND'
  | 'CONFIG_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'NETWORK_ERROR'
  | 'CREDIT_EXHAUSTION'
  | 'INTERNAL_ERROR';

export interface ErrorMetadata {
  [key: string]: unknown;
  timestamp?: string;
  correlationId?: string;
  service?: string;
}

export abstract class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly metadata?: ErrorMetadata;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    isOperational = true,
    metadata?: ErrorMetadata
  ) {
    super(message);

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.metadata = {
      ...metadata,
      timestamp: metadata?.timestamp || new Date().toISOString(),
    };

    // Captures stack trace (excluding constructor call)
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts error to a safe JSON object for API responses
   * Excludes sensitive information like stack traces
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      metadata: this.metadata,
    };
  }

  /**
   * Creates a safe error response for clients
   * Hides internal details in production
   */
  toClientResponse(includeDetails = false) {
    return {
      error: this.message,
      code: this.code,
      ...(includeDetails && this.metadata && { details: this.metadata }),
    };
  }
}
