/**
 * Transformer for vibe analysis results
 * Handles transformation between internal and external result formats
 */

import { matchingResultSchema } from '../../schemas/profile.schema';
import type { VibeAnalysisResult, UserProfile } from '../../types';
import type { MatchingResult } from '../../schemas/profile.schema';
import { ValidationError, ExternalAPIError } from '@/shared/lib/errors';
import { compatibilityCalculator } from '../../lib/compatibility-calculator';

/**
 * Transforms and validates vibe analysis results
 */
export class ResultTransformer {
  /**
   * Parse and validate matching result from API response
   * @param content - Raw JSON string from API
   * @returns Validated matching result
   * @throws {Error} If parsing or validation fails
   */
  parseMatchingResult(content: string): MatchingResult {
    const parsed = this.parseJsonSafely(content);
    return matchingResultSchema.parse(parsed);
  }

  /**
   * Transform matching result to vibe analysis result format
   * @param matchingResult - Result from matching operation
   * @param profileOne - First user's profile
   * @param profileTwo - Second user's profile
   * @returns Transformed vibe analysis result
   */
  transformToVibeResult(
    matchingResult: MatchingResult,
    profileOne: UserProfile,
    profileTwo: UserProfile
  ): VibeAnalysisResult {
    // Calculate compatibility score from personality dimensions
    const { score, breakdown, categoryScores } = compatibilityCalculator.calculateScore(
      profileOne,
      profileTwo
    );

    // Get top matches and clashes for additional context
    const { topMatches, topClashes } = compatibilityCalculator.getTopMatches(breakdown, 3);

    return {
      score,
      analysis: matchingResult.analysis,
      strengths: matchingResult.strengths,
      challenges: matchingResult.challenges,
      sharedInterests: matchingResult.sharedInterests,
      vibeType: matchingResult.vibeType,
      recommendation: matchingResult.recommendation,
      metadata: {
        userOne: profileOne.username,
        userTwo: profileTwo.username,
        sourcesUsed: this.calculateSourcesUsed(profileOne, profileTwo),
        timestamp: matchingResult.metadata.timestamp,
        dimensionBreakdown: breakdown,
        categoryScores,
        topMatches: topMatches.map((d) => d.dimension),
        topClashes: topClashes.map((d) => d.dimension),
      },
    };
  }

  /**
   * Create an error result for vibe analysis
   * @param error - Error message
   * @param userOne - First username
   * @param userTwo - Second username
   * @returns Error result with score -1
   */
  createErrorResult(error: string, userOne: string, userTwo: string): VibeAnalysisResult {
    return {
      score: -1,
      analysis: error,
      strengths: [],
      challenges: [],
      sharedInterests: [],
      metadata: {
        userOne,
        userTwo,
        sourcesUsed: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Normalize score to ensure it's within valid range
   * @param score - Raw score value
   * @returns Score between 0-100
   */
  normalizeScore(score: number): number {
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate total sources used from profiles
   * @param profileOne - First profile
   * @param profileTwo - Second profile
   * @returns Total number of sources
   */
  private calculateSourcesUsed(profileOne: UserProfile, profileTwo: UserProfile): number {
    let sources = 0;

    // Count tweets as sources
    if (profileOne.recentTweets) {
      sources += profileOne.recentTweets.length;
    }
    if (profileTwo.recentTweets) {
      sources += profileTwo.recentTweets.length;
    }

    // Count citations as sources
    if (profileOne.citations) {
      sources += profileOne.citations.length;
    }
    if (profileTwo.citations) {
      sources += profileTwo.citations.length;
    }

    return sources;
  }

  /**
   * Safely parse JSON with validation
   * @param content - JSON string to parse
   * @returns Parsed object
   * @throws {Error} If parsing fails or content is invalid
   */
  private parseJsonSafely(content: string): Record<string, unknown> {
    const MAX_CONTENT_SIZE = 50000; // 50KB limit

    if (content.length > MAX_CONTENT_SIZE) {
      throw new ValidationError(`Response content too large: ${content.length} bytes`, {
        field: 'response',
        value: content.length,
      });
    }

    const parsed = JSON.parse(content);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new ExternalAPIError('Grok API', 'Response must be a JSON object');
    }

    return parsed as Record<string, unknown>;
  }

  /**
   * Enhance result with additional insights
   * @param result - Base result
   * @param profileOne - First profile
   * @param profileTwo - Second profile
   * @returns Enhanced result
   */
  enhanceResult(
    result: VibeAnalysisResult,
    profileOne: UserProfile,
    profileTwo: UserProfile
  ): VibeAnalysisResult {
    // Add profile quality to metadata
    const enhancedMetadata = {
      ...result.metadata,
      profileQuality: {
        userOne: {
          confidence: profileOne.searchConfidence,
          completeness: profileOne.dataCompleteness,
        },
        userTwo: {
          confidence: profileTwo.searchConfidence,
          completeness: profileTwo.dataCompleteness,
        },
      },
    };

    return {
      ...result,
      metadata: enhancedMetadata as typeof result.metadata,
    };
  }

  /**
   * Validate that a result has all required fields
   * @param result - Result to validate
   * @returns True if valid
   */
  validateResult(result: VibeAnalysisResult): boolean {
    return (
      typeof result.score === 'number' &&
      result.score >= -1 &&
      result.score <= 100 &&
      typeof result.analysis === 'string' &&
      result.analysis.length > 0 &&
      Array.isArray(result.strengths) &&
      Array.isArray(result.challenges) &&
      Array.isArray(result.sharedInterests) &&
      typeof result.metadata === 'object' &&
      typeof result.metadata.userOne === 'string' &&
      typeof result.metadata.userTwo === 'string'
    );
  }
}
