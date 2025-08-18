import { GROK_CONFIG, ERROR_MESSAGES } from '../config/constants';
import { FETCH_PROFILE_PROMPT, MATCH_VIBE_PROMPT, PROMPT_MODELS } from '../config/prompts';
import type {
  VibeAnalysisRequest,
  VibeAnalysisResult,
  GrokAPIResponse,
  UserProfile,
} from '../types';
import {
  ConfigError,
  ExternalAPIError,
  NetworkError,
  RateLimitError,
  NotFoundError,
} from '@/shared/lib/errors';
import { grokAPIResponseSchema } from '../schemas';
import {
  userProfileSchema,
  userProfileErrorSchema,
  matchingResultSchema,
} from '../schemas/profile.schema';
import { createChildLogger } from '@/lib/logger';
import { CircuitBreaker } from '@/lib/circuit-breaker';
import { trackGrokUsage, createSessionTracker } from '../lib/usage-tracker';

const logger = createChildLogger('GrokService');

// Global circuit breaker instance for Grok API
const grokCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000, // 1 minute
  expectedThreshold: 0.7, // 70% success rate expected
});

// API configuration type
interface GrokAPIOptions {
  model: string;
  temperature: number;
  maxTokens?: number; // Made optional since we sometimes use undefined
  searchParameters?: {
    dataSources: string[];
    maxResults: number;
  };
}

// Context for API calls to enable better error tracking
interface GrokAPIContext {
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
 * Service for analyzing vibe compatibility between X users using Grok AI
 * Uses two-tier architecture: Grok-3-mini for profile fetching, Grok-4 for matching
 * Includes circuit breaker protection and enhanced error handling
 */
export class GrokService {
  private readonly apiKey: string;
  private sessionTracker: ReturnType<typeof createSessionTracker> | null = null;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new ConfigError(ERROR_MESSAGES.API_KEY_MISSING, 'GROK_API_KEY');
    }
    this.apiKey = apiKey;
  }

  /**
   * Fetches a user profile from X using Grok-3-mini's search capabilities
   * @param username - The X username to fetch (without @)
   * @returns User profile data or throws error if not found
   */
  async fetchProfile(username: string): Promise<UserProfile> {
    try {
      const sanitizedUsername = this.sanitizeForPrompt(username);
      const userPrompt = `Fetch profile for X user: @${sanitizedUsername}`;

      // Debug logging
      logger.debug(
        {
          username: sanitizedUsername,
          model: PROMPT_MODELS.fetchProfile.model,
          searchEnabled: !!PROMPT_MODELS.fetchProfile.searchParameters,
        },
        'Fetching profile'
      );

      const response = await this.callGrokAPI(
        FETCH_PROFILE_PROMPT,
        userPrompt,
        PROMPT_MODELS.fetchProfile,
        {
          operation: 'fetchProfile',
          username: sanitizedUsername,
        }
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new NotFoundError('X user', username);
      }

      const parsed = this.parseJsonSafely(content);

      // Check for error response
      if (parsed.error) {
        const errorData = userProfileErrorSchema.parse(parsed);
        throw new NotFoundError('X user', errorData.username);
      }

      // Validate and return profile
      return userProfileSchema.parse(parsed);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error', username },
        'Failed to fetch user profile'
      );
      throw new ExternalAPIError('Grok', `Failed to fetch profile for @${username}`, error);
    }
  }

  /**
   * Matches two user profiles to determine compatibility
   * @param profileOne - First user's profile
   * @param profileTwo - Second user's profile
   * @returns Compatibility analysis result
   */
  private async matchVibes(
    profileOne: UserProfile,
    profileTwo: UserProfile
  ): Promise<VibeAnalysisResult> {
    try {
      const profilesData = JSON.stringify({
        userOne: profileOne,
        userTwo: profileTwo,
      });

      const response = await this.callGrokAPI(
        MATCH_VIBE_PROMPT,
        profilesData,
        PROMPT_MODELS.matchVibe,
        {
          operation: 'matchVibe',
        }
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Grok API');
      }

      const parsed = this.parseJsonSafely(content);
      const result = matchingResultSchema.parse(parsed);

      // Transform to VibeAnalysisResult format for backward compatibility
      return {
        score: result.score,
        analysis: result.analysis,
        strengths: result.strengths,
        challenges: result.challenges,
        sharedInterests: result.sharedInterests,
        vibeType: result.vibeType,
        recommendation: result.recommendation,
        metadata: {
          userOne: profileOne.username,
          userTwo: profileTwo.username,
          sourcesUsed: 0, // Not applicable for matching phase
          timestamp: result.metadata.timestamp,
        },
      };
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Failed to match vibes'
      );
      throw new ExternalAPIError('Grok', 'Failed to analyze compatibility', error);
    }
  }

  /**
   * Analyzes the vibe compatibility between two X users using two-prompt architecture
   * Step 1: Fetch both profiles in parallel using Grok-3-mini
   * Step 2: Match vibes using Grok-4
   * @param request - The analysis request containing both usernames
   * @returns Vibe compatibility result with score and insights
   */
  async analyzeVibe(request: VibeAnalysisRequest): Promise<VibeAnalysisResult> {
    // Create session tracker for this analysis
    this.sessionTracker = createSessionTracker();

    try {
      // Check circuit breaker state
      if (!grokCircuitBreaker.isAvailable()) {
        const stats = grokCircuitBreaker.getStats();
        logger.warn(stats, 'Circuit breaker is open, rejecting request');
        throw new ExternalAPIError(
          'Grok',
          'Service temporarily unavailable due to recent failures. Please try again later.'
        );
      }

      // Execute with circuit breaker protection
      return await grokCircuitBreaker.execute(async () => {
        // Step 1: Fetch both profiles in parallel
        const [profileOne, profileTwo] = await Promise.all([
          this.fetchProfile(request.userOne),
          this.fetchProfile(request.userTwo),
        ]);

        // Debug log the fetched profiles
        logger.debug({ profileOne }, 'Fetched profile one');
        logger.debug({ profileTwo }, 'Fetched profile two');

        // Step 2: Match vibes using Grok-4
        const result = await this.matchVibes(profileOne, profileTwo);

        // Debug log the final result
        logger.debug({ result }, 'Vibe analysis result');

        // Log session summary with total costs
        if (this.sessionTracker) {
          this.sessionTracker.logSessionSummary(logger);

          // Log completion
          logger.info(
            {
              userOne: request.userOne,
              userTwo: request.userTwo,
              score: result.score,
              sessionCost: this.sessionTracker.getSessionUsage().totalCost.toFixed(6),
            },
            'Vibe analysis completed'
          );

          // Clear session tracker
          this.sessionTracker = null;
        }

        return result;
      });
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof RateLimitError ||
        error instanceof ExternalAPIError ||
        error instanceof NetworkError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }

      // Wrap unknown errors
      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Grok service error'
      );
      throw new ExternalAPIError('Grok', ERROR_MESSAGES.ANALYSIS_FAILED, error);
    }
  }

  /**
   * Centralized error handler for Grok API calls
   * Provides detailed logging and consistent error mapping
   */
  private handleGrokAPIError(error: unknown, context: GrokAPIContext): never {
    const elapsedTime = context.startTime ? Date.now() - context.startTime : undefined;

    // Build comprehensive error context
    const errorContext = {
      ...context,
      elapsedTime,
      timestamp: new Date().toISOString(),
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
              cause: (error as Error & { cause?: unknown }).cause,
            }
          : error,
    };

    // Re-throw our custom errors as-is (they're already logged)
    if (
      error instanceof RateLimitError ||
      error instanceof NotFoundError ||
      error instanceof ExternalAPIError
    ) {
      logger.warn(errorContext, `Grok API returned error during ${context.operation}`);
      throw error;
    }

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error(
        {
          ...errorContext,
          errorType: 'timeout',
        },
        `Grok API timeout after ${context.timeout}ms during ${context.operation}`
      );
      throw new NetworkError('Grok API', error, {
        timeout: context.timeout,
        operation: context.operation,
        model: context.model,
      });
    }

    // Handle network/connection errors
    if (error instanceof TypeError) {
      const isNetworkError =
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ETIMEDOUT');

      if (isNetworkError) {
        const errorType = error.message.includes('ECONNREFUSED')
          ? 'connection_refused'
          : error.message.includes('ENOTFOUND')
            ? 'dns_failure'
            : error.message.includes('ETIMEDOUT')
              ? 'connection_timeout'
              : 'network_error';

        logger.error(
          {
            ...errorContext,
            errorType,
          },
          `Network error (${errorType}) connecting to Grok API during ${context.operation}`
        );

        throw new NetworkError('Grok API', error, {
          errorType,
          operation: context.operation,
          endpoint: context.endpoint,
          model: context.model,
        });
      }
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      logger.error(
        {
          ...errorContext,
          errorType: 'json_parse_error',
        },
        `Failed to parse Grok API response during ${context.operation}`
      );
      throw new ExternalAPIError(
        'Grok',
        `Invalid JSON response during ${context.operation}`,
        error,
        502
      );
    }

    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      logger.error(
        {
          ...errorContext,
          errorType: 'validation_error',
        },
        `Response validation failed during ${context.operation}`
      );
      throw new ExternalAPIError(
        'Grok',
        `Invalid API response format during ${context.operation}`,
        error,
        502
      );
    }

    // Handle unknown errors
    logger.error(
      {
        ...errorContext,
        errorType: 'unknown',
      },
      `Unexpected error during Grok API ${context.operation}`
    );

    throw new ExternalAPIError('Grok', `Unexpected error during ${context.operation}`, error, 500);
  }

  /**
   * Sanitizes input for use in prompts to prevent injection attacks
   * @param input - The input string to sanitize
   * @returns Sanitized string safe for prompt inclusion
   */
  private sanitizeForPrompt(input: string): string {
    // Remove or escape potentially dangerous characters/patterns
    return (
      input
        // Remove any control characters and non-printable chars
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        // Remove potential prompt injection patterns
        .replace(/\n\s*System:/gi, '[SYSTEM]')
        .replace(/\n\s*Assistant:/gi, '[ASSISTANT]')
        .replace(/\n\s*Human:/gi, '[HUMAN]')
        .replace(/\n\s*User:/gi, '[USER]')
        // Remove excessive whitespace and newlines
        .replace(/\s+/g, ' ')
        .trim()
        // Limit length to prevent prompt stuffing
        .slice(0, 50)
    );
  }

  /**
   * Calls the Grok API with configurable model and parameters
   */
  private async callGrokAPI(
    systemPrompt: string,
    userPrompt: string,
    options: GrokAPIOptions,
    context?: Partial<GrokAPIContext>
  ): Promise<GrokAPIResponse> {
    const endpoint = `${GROK_CONFIG.baseUrl}/chat/completions`;
    const startTime = Date.now();

    // Use longer timeout when search is enabled
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Log the API call initiation
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

      const body: Record<string, unknown> = {
        model: options.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature,
        response_format: { type: 'json_object' },
      };

      // Only add max_tokens if it's defined
      if (options.maxTokens !== undefined) {
        body.max_tokens = options.maxTokens;
      }

      // Add search parameters if provided
      if (options.searchParameters) {
        body.search_parameters = {
          mode: 'on', // Force search to be enabled
          sources: options.searchParameters.dataSources.map((source) => ({ type: source })),
          max_search_results: options.searchParameters.maxResults,
          return_citations: true, // Include citations for transparency
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      clearTimeout(timeout);

      const responseTime = Date.now() - startTime;
      logger.debug(
        {
          status: response.status,
          responseTime,
          operation: fullContext.operation,
        },
        `Grok API response received in ${responseTime}ms`
      );

      if (!response.ok) {
        // Log the error details for debugging
        const errorText = await response.text();
        logger.error(
          {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
            requestBody: body,
          },
          'Grok API error response'
        );

        if (response.status === 429) {
          // Extract retry-after header if available
          const retryAfter = response.headers.get('retry-after');
          throw new RateLimitError(
            ERROR_MESSAGES.RATE_LIMIT,
            retryAfter ? parseInt(retryAfter, 10) : undefined
          );
        }

        if (response.status === 404) {
          throw new NotFoundError('X user', 'unknown');
        }

        // Handle other API errors - recreate response for error handling
        const errorResponse = new Response(errorText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        throw await ExternalAPIError.fromResponse('Grok', errorResponse, 'vibe analysis');
      }

      const rawData = await response.json();
      const data = grokAPIResponseSchema.parse(rawData);

      // Track API usage and costs
      trackGrokUsage(options.model, data.usage, logger);

      // Track in session if available
      if (this.sessionTracker) {
        this.sessionTracker.track(options.model, data.usage);
      }

      return data;
    } catch (error) {
      clearTimeout(timeout);

      // Use centralized error handler
      this.handleGrokAPIError(error, fullContext);
    }
  }

  /**
   * Safely parse JSON with size and structure validation
   */
  private parseJsonSafely(content: string): Record<string, unknown> {
    const MAX_CONTENT_SIZE = 50000; // 50KB limit for response content

    // Check content size
    if (content.length > MAX_CONTENT_SIZE) {
      throw new Error(`Response content too large: ${content.length} bytes`);
    }

    // Parse JSON
    const parsed = JSON.parse(content);

    // Validate structure
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Response must be a JSON object');
    }

    return parsed as Record<string, unknown>;
  }
}
