/**
 * Low-level API client for Grok AI service
 * Handles HTTP communication, timeouts, response validation, rate limiting, and retries
 */

import { GROK_CONFIG } from '../../config/grok-config';
import { grokAPIResponseSchema } from '../../schemas';
import type { GrokAPIResponse } from '../../types';
import { createChildLogger } from '@/lib/logger';
import { NetworkError, RateLimitError, NotFoundError, ExternalAPIError } from '@/shared/lib/errors';
import { GrokRetryManager } from './grok-retry-manager';

const logger = createChildLogger('GrokAPIClient');

/**
 * Configuration options for Grok API requests
 */
export interface GrokAPIOptions {
  model: string;
  temperature: number;
  maxTokens?: number;
  searchParameters?: {
    dataSources: string[];
    maxResults: number;
  };
}

/**
 * Context information for API calls (used for logging and error handling)
 */
export interface GrokAPIContext {
  model: string;
  operation: 'fetchProfile' | 'matchVibe' | 'unknown';
  endpoint: string;
  timeout: number;
  hasSearch: boolean;
  username?: string;
  requestSize?: number;
  startTime?: number;
}

/**
 * Low-level client for Grok API communication
 * Handles HTTP requests, timeouts, rate limiting, retries, and error mapping
 */
export class GrokAPIClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly retryManager: GrokRetryManager;

  constructor(apiKey: string, baseUrl: string = GROK_CONFIG.baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.retryManager = new GrokRetryManager();
  }

  /**
   * Execute a chat completion request to the Grok API with rate limiting and retries
   * @param systemPrompt - System instruction prompt
   * @param userPrompt - User message content
   * @param options - API configuration options
   * @param context - Additional context for logging
   * @returns Validated API response
   * @throws {NetworkError} For connection issues
   * @throws {RateLimitError} When rate limited after all retries
   * @throws {ExternalAPIError} For API errors
   */
  async chatCompletion(
    systemPrompt: string,
    userPrompt: string,
    options: GrokAPIOptions,
    context?: Partial<GrokAPIContext>
  ): Promise<GrokAPIResponse> {
    const endpoint = `${this.baseUrl}/chat/completions`;
    const startTime = Date.now();

    // Calculate timeout based on search parameters
    const timeoutMs = options.searchParameters
      ? GROK_CONFIG.timeouts.searchEnabled
      : GROK_CONFIG.timeouts.request;

    // Build full context for error handling
    const fullContext: GrokAPIContext = {
      model: options.model,
      operation: context?.operation || 'unknown',
      endpoint,
      timeout: timeoutMs,
      hasSearch: !!options.searchParameters,
      username: context?.username,
      requestSize: JSON.stringify({ systemPrompt, userPrompt, options }).length,
      startTime,
      ...context,
    };

    try {
      logger.debug(
        {
          model: options.model,
          operation: fullContext.operation,
          hasSearch: fullContext.hasSearch,
          username: fullContext.username,
          timeout: timeoutMs,
        },
        `Initiating Grok API call for ${fullContext.operation} with ${timeoutMs}ms timeout`
      );

      // Execute with retry logic
      const response = await this.retryManager.retryWithBackoff(
        async () => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), timeoutMs);

          try {
            const response = await this.executeRequest(
              endpoint,
              systemPrompt,
              userPrompt,
              options,
              controller.signal
            );

            clearTimeout(timeout);
            return response;
          } catch (error) {
            clearTimeout(timeout);
            throw error;
          }
        },
        {
          // Custom retry options can be passed here if needed
          maxAttempts: context?.operation === 'fetchProfile' ? 3 : 5,
        }
      );

      const responseTime = Date.now() - startTime;
      logger.debug(
        {
          status: response.status,
          responseTime,
          operation: fullContext.operation,
          model: options.model,
        },
        `Grok API response received in ${responseTime}ms`
      );

      const result = await this.handleResponse(response, fullContext);

      return result;
    } catch (error) {
      throw this.mapError(error, fullContext);
    }
  }

  /**
   * Execute the HTTP request to Grok API
   */
  private async executeRequest(
    endpoint: string,
    systemPrompt: string,
    userPrompt: string,
    options: GrokAPIOptions,
    signal: AbortSignal
  ): Promise<Response> {
    const body = this.buildRequestBody(systemPrompt, userPrompt, options);

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify(body),
    });
  }

  /**
   * Build the request body for Grok API
   */
  private buildRequestBody(
    systemPrompt: string,
    userPrompt: string,
    options: GrokAPIOptions
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: options.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature,
      response_format: { type: 'json_object' },
    };

    // Only add max_tokens if defined
    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    }

    // Add search parameters if provided
    if (options.searchParameters) {
      body.search_parameters = {
        mode: 'on',
        sources: options.searchParameters.dataSources.map((source) => ({ type: source })),
        max_search_results: options.searchParameters.maxResults,
        return_citations: true,
      };
    }

    return body;
  }

  /**
   * Handle and validate API response
   */
  private async handleResponse(
    response: Response,
    context: GrokAPIContext
  ): Promise<GrokAPIResponse> {
    if (!response.ok) {
      await this.handleErrorResponse(response, context);
    }

    const rawData = await response.json();
    return grokAPIResponseSchema.parse(rawData);
  }

  /**
   * Handle error responses from the API
   * Note: 429 errors are now handled by GrokRetryManager, but we keep this for completeness
   */
  private async handleErrorResponse(response: Response, context: GrokAPIContext): Promise<never> {
    const errorText = await response.text();

    logger.error(
      {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        operation: context.operation,
        headers: {
          'retry-after': response.headers.get('retry-after'),
          'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
          'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
        },
      },
      'Grok API error response'
    );

    if (response.status === 429) {
      // This should be handled by retry logic, but keep as fallback
      const retryAfter = response.headers.get('retry-after');
      const resetTime = response.headers.get('x-ratelimit-reset');

      throw new RateLimitError(
        'API rate limit exceeded (max retries reached)',
        retryAfter ? parseInt(retryAfter, 10) : undefined,
        {
          retryAfter,
          resetTime,
          model: context.model,
        }
      );
    }

    if (response.status === 404) {
      throw new NotFoundError('X user', context.username || 'unknown');
    }

    // Create error response for other status codes
    const errorResponse = new Response(errorText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    throw await ExternalAPIError.fromResponse('Grok', errorResponse, context.operation);
  }

  /**
   * Map errors to appropriate error types
   */
  private mapError(error: unknown, context: GrokAPIContext): Error {
    const elapsedTime = context.startTime ? Date.now() - context.startTime : undefined;

    // Re-throw our custom errors as-is
    if (
      error instanceof RateLimitError ||
      error instanceof NotFoundError ||
      error instanceof ExternalAPIError
    ) {
      return error;
    }

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error(
        {
          operation: context.operation,
          timeout: context.timeout,
          elapsedTime,
        },
        `Grok API timeout after ${context.timeout}ms`
      );

      return new NetworkError('Grok API', error, {
        timeout: context.timeout,
        operation: context.operation,
        model: context.model,
      });
    }

    // Handle network errors
    if (error instanceof TypeError && this.isNetworkError(error.message)) {
      const errorType = this.getNetworkErrorType(error.message);

      logger.error(
        {
          operation: context.operation,
          errorType,
          endpoint: context.endpoint,
          elapsedTime,
        },
        `Network error (${errorType}) connecting to Grok API`
      );

      return new NetworkError('Grok API', error, {
        errorType,
        operation: context.operation,
        endpoint: context.endpoint,
        model: context.model,
      });
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      logger.error(
        {
          operation: context.operation,
          elapsedTime,
        },
        'Failed to parse Grok API response'
      );

      return new ExternalAPIError(
        'Grok',
        `Invalid JSON response during ${context.operation}`,
        error,
        502
      );
    }

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      logger.error(
        {
          operation: context.operation,
          elapsedTime,
        },
        'Response validation failed'
      );

      return new ExternalAPIError(
        'Grok',
        `Invalid API response format during ${context.operation}`,
        error,
        502
      );
    }

    // Handle unknown errors
    logger.error(
      {
        operation: context.operation,
        error: error instanceof Error ? error.message : 'Unknown error',
        elapsedTime,
      },
      'Unexpected error during Grok API call'
    );

    return new ExternalAPIError('Grok', `Unexpected error during ${context.operation}`, error, 500);
  }

  /**
   * Check if an error message indicates a network error
   */
  private isNetworkError(message: string): boolean {
    return (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND') ||
      message.includes('ETIMEDOUT')
    );
  }

  /**
   * Get specific network error type from error message
   */
  private getNetworkErrorType(message: string): string {
    if (message.includes('ECONNREFUSED')) return 'connection_refused';
    if (message.includes('ENOTFOUND')) return 'dns_failure';
    if (message.includes('ETIMEDOUT')) return 'connection_timeout';
    return 'network_error';
  }
}
