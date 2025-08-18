/**
 * Main orchestration service for Grok-powered vibe analysis
 * Coordinates between API client, transformers, and error handling
 */

import { ERROR_MESSAGES } from '../../config/constants';
import { PROMPT_MODELS } from '../../config/prompts';
import type { VibeAnalysisRequest, VibeAnalysisResult, UserProfile } from '../../types';
import { NotFoundError } from '@/shared/lib/errors';
import { createChildLogger } from '@/lib/logger';
import { CircuitBreaker } from '@/lib/circuit-breaker';
import { trackGrokUsage, createSessionTracker } from '../../lib/usage-tracker';

// Import new components
import { GrokAPIClient } from './grok-api-client';
import { GrokErrorHandler } from './grok-error-handler';
import { GrokPromptBuilder } from './grok-prompt-builder';
import { ProfileTransformer } from '../transformers/profile.transformer';
import { ResultTransformer } from '../transformers/result.transformer';

const logger = createChildLogger('GrokService');

// Global circuit breaker for Grok API protection
const grokCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000, // 1 minute
  expectedThreshold: 0.7, // 70% success rate expected
});

/**
 * High-level service for analyzing vibe compatibility between X users
 *
 * Architecture:
 * - Two-tier model usage: Grok-3-mini for profiles, Grok-4 for matching
 * - Circuit breaker protection for fault tolerance
 * - Comprehensive error handling and recovery
 * - Usage tracking for cost monitoring
 *
 * @example
 * ```typescript
 * const service = new GrokService(apiKey);
 * const result = await service.analyzeVibe({
 *   userOne: 'elonmusk',
 *   userTwo: 'billgates'
 * });
 * console.log(`Compatibility: ${result.score}/100`);
 * ```
 */
export class GrokService {
  private readonly apiClient: GrokAPIClient;
  private readonly errorHandler: GrokErrorHandler;
  private readonly promptBuilder: GrokPromptBuilder;
  private readonly profileTransformer: ProfileTransformer;
  private readonly resultTransformer: ResultTransformer;
  private sessionTracker: ReturnType<typeof createSessionTracker> | null = null;

  /**
   * Initialize the Grok service with required dependencies
   * @param apiKey - Grok API key (required)
   * @throws {ConfigError} If API key is missing
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      this.errorHandler = new GrokErrorHandler();
      this.errorHandler.handleConfigError(ERROR_MESSAGES.API_KEY_MISSING, 'GROK_API_KEY');
    }

    // Initialize dependencies
    this.apiClient = new GrokAPIClient(apiKey);
    this.errorHandler = new GrokErrorHandler();
    this.promptBuilder = new GrokPromptBuilder();
    this.profileTransformer = new ProfileTransformer();
    this.resultTransformer = new ResultTransformer();
  }

  /**
   * Analyze vibe compatibility between two X users
   *
   * Process:
   * 1. Fetch both user profiles in parallel
   * 2. Match profiles to determine compatibility
   * 3. Return structured analysis with score
   *
   * @param request - Analysis request with two usernames
   * @returns Vibe compatibility analysis
   * @throws {NotFoundError} If user not found
   * @throws {ExternalAPIError} For API failures
   * @throws {RateLimitError} When rate limited
   */
  async analyzeVibe(request: VibeAnalysisRequest): Promise<VibeAnalysisResult> {
    // Create session tracker for cost monitoring
    this.sessionTracker = createSessionTracker();

    try {
      // Check circuit breaker state
      if (!grokCircuitBreaker.isAvailable()) {
        const stats = grokCircuitBreaker.getStats();
        logger.warn(stats, 'Circuit breaker is open');
        this.errorHandler.handleCircuitBreakerOpen();
      }

      // Execute with circuit breaker protection
      return await grokCircuitBreaker.execute(async () => {
        this.errorHandler.logOperationStart('analyzeVibe', {
          userOne: request.userOne,
          userTwo: request.userTwo,
        });

        // Step 1: Fetch both profiles in parallel
        const [profileOne, profileTwo] = await Promise.all([
          this.fetchProfile(request.userOne),
          this.fetchProfile(request.userTwo),
        ]);

        logger.debug({ profileOne, profileTwo }, 'Profiles fetched successfully');

        // Step 2: Match vibes
        const result = await this.matchVibes(profileOne, profileTwo);

        // Log completion with session summary
        if (this.sessionTracker) {
          this.sessionTracker.logSessionSummary(logger);
          const sessionUsage = this.sessionTracker.getSessionUsage();

          this.errorHandler.logSuccess('analyzeVibe', {
            userOne: request.userOne,
            userTwo: request.userTwo,
            score: result.score,
            sessionCost: sessionUsage.totalCost.toFixed(6),
          });

          this.sessionTracker = null;
        }

        return result;
      });
    } catch (error) {
      this.errorHandler.handleAnalysisError(error, request.userOne, request.userTwo);
    }
  }

  /**
   * Fetch a user profile from X using Grok's search capabilities
   * @param username - X username (without @)
   * @returns User profile data
   * @throws {NotFoundError} If user not found
   * @throws {ExternalAPIError} For API failures
   */
  private async fetchProfile(username: string): Promise<UserProfile> {
    try {
      // Build prompt with sanitization
      const { systemPrompt, userPrompt, sanitizedUsername } =
        this.promptBuilder.buildProfileFetchPrompt(username);

      logger.debug(
        {
          username: sanitizedUsername,
          model: PROMPT_MODELS.fetchProfile.model,
        },
        'Fetching profile'
      );

      // Call API
      const response = await this.apiClient.chatCompletion(
        systemPrompt,
        userPrompt,
        PROMPT_MODELS.fetchProfile,
        {
          operation: 'fetchProfile',
          username: sanitizedUsername,
        }
      );

      // Track usage
      if (response.usage) {
        trackGrokUsage(PROMPT_MODELS.fetchProfile.model, response.usage, logger);
        if (this.sessionTracker) {
          this.sessionTracker.track(PROMPT_MODELS.fetchProfile.model, response.usage);
        }
      }

      // Extract and parse response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new NotFoundError('X user', username);
      }

      // Transform response to profile
      const parseResult = this.profileTransformer.parseProfileResponse(content);

      if (!parseResult.success) {
        throw new NotFoundError('X user', parseResult.error.username);
      }

      return this.profileTransformer.normalizeProfile(parseResult.data);
    } catch (error) {
      this.errorHandler.handleProfileFetchError(error, username);
    }
  }

  /**
   * Match two user profiles to determine compatibility
   * @param profileOne - First user's profile
   * @param profileTwo - Second user's profile
   * @returns Compatibility analysis
   * @throws {ExternalAPIError} For API failures
   */
  private async matchVibes(
    profileOne: UserProfile,
    profileTwo: UserProfile
  ): Promise<VibeAnalysisResult> {
    try {
      // Build matching prompt
      const { systemPrompt, userPrompt } = this.promptBuilder.buildMatchingPrompt(
        profileOne,
        profileTwo
      );

      // Call API
      const response = await this.apiClient.chatCompletion(
        systemPrompt,
        userPrompt,
        PROMPT_MODELS.matchVibe,
        {
          operation: 'matchVibe',
        }
      );

      // Track usage
      if (response.usage) {
        trackGrokUsage(PROMPT_MODELS.matchVibe.model, response.usage, logger);
        if (this.sessionTracker) {
          this.sessionTracker.track(PROMPT_MODELS.matchVibe.model, response.usage);
        }
      }

      // Extract and parse response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Grok API');
      }

      // Transform to result format
      const matchingResult = this.resultTransformer.parseMatchingResult(content);
      const vibeResult = this.resultTransformer.transformToVibeResult(
        matchingResult,
        profileOne,
        profileTwo
      );

      // Enhance with additional metadata
      return this.resultTransformer.enhanceResult(vibeResult, profileOne, profileTwo);
    } catch (error) {
      this.errorHandler.handleMatchingError(error, {
        operation: 'matchVibes',
        username: `${profileOne.username},${profileTwo.username}`,
      });
    }
  }

  /**
   * Get current circuit breaker statistics
   * @returns Circuit breaker state and metrics
   */
  getCircuitBreakerStats() {
    return grokCircuitBreaker.getStats();
  }

  /**
   * Manually reset the circuit breaker
   * Use with caution - only when you're sure the service has recovered
   */
  resetCircuitBreaker() {
    grokCircuitBreaker.manualReset();
    logger.info('Circuit breaker manually reset');
  }
}
