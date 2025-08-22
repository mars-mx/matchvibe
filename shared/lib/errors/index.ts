/**
 * Centralized error handling exports
 * Provides all error classes and utilities for consistent error management
 */

// Base error class and types
export { AppError, type ErrorCode, type ErrorMetadata } from './base.error';

// Specific error classes
export {
  ValidationError,
  RateLimitError,
  NotFoundError,
  ConfigError,
  ExternalAPIError,
  NetworkError,
  CreditExhaustionError,
  InternalError,
} from './specific.errors';

// Error handler and utilities
export {
  handleApiError,
  isAppError,
  isOperationalError,
  createWarningResponse,
  type ErrorResponse,
} from './handler';

// Re-export for convenience
export { ZodError } from 'zod';
