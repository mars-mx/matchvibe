import { GROK_CONFIG, ERROR_MESSAGES } from '../config/constants';
import { VIBE_COMPATIBILITY_PROMPT, ANALYSIS_INSTRUCTIONS } from '../config/prompts';
import type { VibeAnalysisRequest, VibeAnalysisResult, GrokAPIResponse } from '../types';
import {
  ConfigError,
  ExternalAPIError,
  NetworkError,
  RateLimitError,
  NotFoundError,
} from '@/shared/lib/errors';
import { grokAPIResponseSchema, vibeAnalysisResultSchema } from '../schemas';
import { createChildLogger } from '@/lib/logger';
import { CircuitBreaker } from '@/lib/circuit-breaker';

const logger = createChildLogger('GrokService');

// Global circuit breaker instance for Grok API
const grokCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000, // 1 minute
  expectedThreshold: 0.7, // 70% success rate expected
});

/**
 * Service for analyzing vibe compatibility between X users using Grok-4 AI
 * Includes circuit breaker protection and enhanced error handling
 */
export class GrokService {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new ConfigError(ERROR_MESSAGES.API_KEY_MISSING, 'GROK_API_KEY');
    }
    this.apiKey = apiKey;
  }

  /**
   * Analyzes the vibe compatibility between two X users using Grok's real-time search
   * Includes circuit breaker protection for resilience
   * @param request - The analysis request containing both usernames
   * @returns Vibe compatibility result with score and insights
   */
  async analyzeVibe(request: VibeAnalysisRequest): Promise<VibeAnalysisResult> {
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
        const systemPrompt = VIBE_COMPATIBILITY_PROMPT;
        const userPrompt = this.buildUserPrompt(request);
        const grokResponse = await this.callGrokAPI(systemPrompt, userPrompt, request);
        return this.parseGrokResponse(grokResponse, request);
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
   * Builds the user prompt for Grok based on the analysis request
   * Includes prompt injection protection
   */
  private buildUserPrompt(request: VibeAnalysisRequest): string {
    const { userOne, userTwo, analysisDepth = 'standard' } = request;

    // Sanitize usernames to prevent prompt injection
    const sanitizedUserOne = this.sanitizeForPrompt(userOne);
    const sanitizedUserTwo = this.sanitizeForPrompt(userTwo);

    return `${ANALYSIS_INSTRUCTIONS.searchFirst}
${ANALYSIS_INSTRUCTIONS.analyzeQuality}
${ANALYSIS_INSTRUCTIONS.checkEngagement}

Analyze the vibe compatibility between X users @${sanitizedUserOne} and @${sanitizedUserTwo}.
Analysis depth: ${analysisDepth}

Key Analysis Points:
1. Search X for recent tweets from both users (last 7-14 days)
2. Calculate their shitpost vs quality content ratio
3. Analyze their engagement patterns (replies, interactions, response rates)
4. Compare their content styles (memes, threads, original vs retweets)
5. Determine compatibility based on matching vibes (shitposters with shitposters, etc.)

${ANALYSIS_INSTRUCTIONS.matchStyles}

Provide a compatibility score (0-100) heavily weighted by content style alignment and interaction compatibility.`;
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
   * Calls the Grok API with search parameters enabled
   */
  private async callGrokAPI(
    systemPrompt: string,
    userPrompt: string,
    request?: VibeAnalysisRequest
  ): Promise<GrokAPIResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GROK_CONFIG.timeouts.request);

    try {
      const response = await fetch(`${GROK_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: GROK_CONFIG.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          searchParameters: {
            searchMode: GROK_CONFIG.search.mode,
            dataSources: GROK_CONFIG.search.dataSources,
            maxResults: GROK_CONFIG.search.maxResults,
          },
          temperature: GROK_CONFIG.generation.temperature,
          max_tokens: GROK_CONFIG.generation.maxTokens,
          response_format: GROK_CONFIG.generation.responseFormat,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 429) {
          // Extract retry-after header if available
          const retryAfter = response.headers.get('retry-after');
          throw new RateLimitError(
            ERROR_MESSAGES.RATE_LIMIT,
            retryAfter ? parseInt(retryAfter, 10) : undefined
          );
        }

        if (response.status === 404) {
          throw new NotFoundError('X user', request?.userOne || request?.userTwo);
        }

        // Handle other API errors
        throw await ExternalAPIError.fromResponse('Grok', response, 'vibe analysis');
      }

      const rawData = await response.json();
      const data = grokAPIResponseSchema.parse(rawData);

      // Log search usage for monitoring
      if (data.usage?.num_sources_used) {
        logger.info(
          { sources: data.usage.num_sources_used },
          `Searched ${data.usage.num_sources_used} X sources`
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeout);

      // Re-throw our custom errors
      if (
        error instanceof RateLimitError ||
        error instanceof NotFoundError ||
        error instanceof ExternalAPIError
      ) {
        throw error;
      }

      // Handle network errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Grok API', error, {
          timeout: GROK_CONFIG.timeouts.request,
        });
      }

      // Handle other network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Grok API', error);
      }

      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Parses the Grok API response into a structured result with enhanced safety
   */
  private parseGrokResponse(
    response: GrokAPIResponse,
    request: VibeAnalysisRequest
  ): VibeAnalysisResult {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Grok API');
      }

      // Enhanced JSON parsing with safety checks
      const parsed = this.parseJsonSafely(content);

      // Validate and normalize the score with additional safety
      const rawScore = parsed.score;
      const score = this.validateScore(rawScore);

      // Sanitize text fields to prevent potential issues
      const analysis = this.sanitizeText(parsed.analysis || 'Compatibility analysis completed');
      const strengths = this.sanitizeArrayOfStrings(parsed.strengths || []);
      const challenges = this.sanitizeArrayOfStrings(parsed.challenges || []);
      const sharedInterests = this.sanitizeArrayOfStrings(parsed.sharedInterests || []);

      const result = {
        score,
        analysis,
        strengths,
        challenges,
        sharedInterests,
        metadata: {
          userOne: request.userOne,
          userTwo: request.userTwo,
          sourcesUsed: response.usage?.num_sources_used || 0,
          timestamp: new Date().toISOString(),
        },
      };

      // Validate the result structure with Zod
      return vibeAnalysisResultSchema.parse(result);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          rawContentPreview: response.choices[0]?.message?.content?.substring(0, 200),
        },
        'Failed to parse Grok response'
      );

      // Throw a proper error instead of returning fake success
      throw new ExternalAPIError(
        'Grok',
        'Failed to parse analysis response. The AI model returned an unexpected format.',
        error
      );
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

  /**
   * Validate and normalize score value
   */
  private validateScore(rawScore: unknown): number {
    if (typeof rawScore === 'number' && !isNaN(rawScore)) {
      return Math.min(100, Math.max(0, Math.round(rawScore)));
    }

    if (typeof rawScore === 'string') {
      const numericScore = parseFloat(rawScore);
      if (!isNaN(numericScore)) {
        return Math.min(100, Math.max(0, Math.round(numericScore)));
      }
    }

    // Default to neutral score if invalid
    logger.warn({ rawScore }, 'Invalid score received, defaulting to 50');
    return 50;
  }

  /**
   * Sanitize text content to prevent issues
   */
  private sanitizeText(text: unknown): string {
    if (typeof text !== 'string') {
      return 'Analysis unavailable';
    }

    return (
      text
        .trim()
        .substring(0, 1000) // Limit length
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') || // Remove control chars
      'Analysis unavailable'
    );
  }

  /**
   * Sanitize array of strings with validation
   */
  private sanitizeArrayOfStrings(arr: unknown): string[] {
    if (!Array.isArray(arr)) {
      return [];
    }

    return arr
      .filter((item): item is string => typeof item === 'string')
      .map((item) => this.sanitizeText(item))
      .filter((item) => item.length > 0)
      .slice(0, 10); // Limit array size
  }
}
