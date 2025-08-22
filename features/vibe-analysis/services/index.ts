/**
 * Service exports for vibe analysis feature
 *
 * Main exports:
 * - GrokService: High-level orchestration service
 *
 * Component exports (for testing/extension):
 * - GrokAPIClient: Low-level API communication
 * - GrokErrorHandler: Error handling utilities
 * - GrokPromptBuilder: Prompt construction
 * - ProfileTransformer: Profile data transformation
 * - ResultTransformer: Result data transformation
 */

// Main service
export { GrokService } from './grok/grok.service';

// API client for direct usage if needed
export { GrokAPIClient } from './grok/grok-api-client';
export type { GrokAPIOptions, GrokAPIContext } from './grok/grok-api-client';

// Error handling utilities
export { GrokErrorHandler } from './grok/grok-error-handler';
export type { ErrorContext } from './grok/grok-error-handler';

// Prompt builder
export { GrokPromptBuilder } from './grok/grok-prompt-builder';
export type { SanitizedUsername } from './grok/grok-prompt-builder';

// Transformers
export { ProfileTransformer } from './transformers/profile.transformer';
export { ResultTransformer } from './transformers/result.transformer';
export type { ProfileParseResult } from './transformers/profile.transformer';
