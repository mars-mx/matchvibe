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

const logger = createChildLogger('GrokService');

/**
 * Service for analyzing vibe compatibility between X users using Grok-4 AI
 * This is a naive/MVP implementation that leverages Grok's native search capabilities
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
   * @param request - The analysis request containing both usernames
   * @returns Vibe compatibility result with score and insights
   */
  async analyzeVibe(request: VibeAnalysisRequest): Promise<VibeAnalysisResult> {
    try {
      const systemPrompt = VIBE_COMPATIBILITY_PROMPT;

      const userPrompt = this.buildUserPrompt(request);

      const grokResponse = await this.callGrokAPI(systemPrompt, userPrompt, request);

      return this.parseGrokResponse(grokResponse, request);
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
      logger.error({ error }, 'Grok service error');
      throw new ExternalAPIError('Grok', ERROR_MESSAGES.ANALYSIS_FAILED, error);
    }
  }

  /**
   * Builds the user prompt for Grok based on the analysis request
   */
  private buildUserPrompt(request: VibeAnalysisRequest): string {
    const { userOne, userTwo, analysisDepth = 'standard' } = request;

    return `${ANALYSIS_INSTRUCTIONS.searchFirst}
${ANALYSIS_INSTRUCTIONS.analyzeQuality}
${ANALYSIS_INSTRUCTIONS.checkEngagement}

Analyze the vibe compatibility between X users @${userOne} and @${userTwo}.
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
   * Parses the Grok API response into a structured result
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

      const parsed = JSON.parse(content);

      // Validate and normalize the score
      const score = Math.min(100, Math.max(0, Number(parsed.score) || 50));

      const result = {
        score,
        analysis: parsed.analysis || 'Compatibility analysis completed',
        strengths: parsed.strengths || [],
        challenges: parsed.challenges || [],
        sharedInterests: parsed.sharedInterests || [],
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
        { error, rawContent: response.choices[0]?.message?.content?.substring(0, 500) },
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
}
