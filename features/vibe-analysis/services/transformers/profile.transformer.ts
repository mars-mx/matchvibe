/**
 * Transformer for user profile data
 * Handles validation and transformation of profile responses
 */

import { userProfileSchema, userProfileErrorSchema } from '../../schemas/profile.schema';
import type { UserProfile, UserProfileError } from '../../types';

/**
 * Result type for profile parsing
 */
export type ProfileParseResult =
  | { success: true; data: UserProfile }
  | { success: false; error: UserProfileError };

/**
 * Transforms and validates user profile data from Grok API responses
 */
export class ProfileTransformer {
  /**
   * Parse and validate profile data from API response content
   * @param content - Raw JSON string from API
   * @returns Parsed profile or error result
   * @throws {Error} If JSON parsing fails
   */
  parseProfileResponse(content: string): ProfileParseResult {
    const parsed = this.parseJsonSafely(content);

    // Check if it's an error response
    if (this.isErrorResponse(parsed)) {
      const errorData = userProfileErrorSchema.parse(parsed);
      return {
        success: false,
        error: errorData,
      };
    }

    // Validate and return profile
    const profile = userProfileSchema.parse(parsed);
    return {
      success: true,
      data: profile,
    };
  }

  /**
   * Transform raw profile data to ensure consistency
   * @param profile - Raw profile data
   * @returns Normalized profile
   */
  normalizeProfile(profile: UserProfile): UserProfile {
    return {
      ...profile,
      // Ensure username doesn't have @ prefix
      username: profile.username.replace(/^@/, ''),
      // Normalize null/undefined values
      displayName: profile.displayName || null,
      recentTweets: profile.recentTweets || null,
      topTopics: profile.topTopics || null,
      notableTraits: profile.notableTraits || null,
      // Ensure confidence scores are within bounds
      searchConfidence: Math.min(100, Math.max(0, profile.searchConfidence)),
      dataCompleteness: Math.min(100, Math.max(0, profile.dataCompleteness)),
    };
  }

  /**
   * Check if a parsed response is an error response
   * @param parsed - Parsed JSON object
   * @returns True if it's an error response
   */
  private isErrorResponse(parsed: unknown): boolean {
    return (
      typeof parsed === 'object' && parsed !== null && 'error' in parsed && 'username' in parsed
    );
  }

  /**
   * Safely parse JSON with size validation
   * @param content - JSON string to parse
   * @returns Parsed object
   * @throws {Error} If content is too large or invalid
   */
  private parseJsonSafely(content: string): Record<string, unknown> {
    const MAX_CONTENT_SIZE = 50000; // 50KB limit

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
   * Extract username from profile or error response
   * @param data - Profile or error data
   * @returns Username if available
   */
  extractUsername(data: UserProfile | UserProfileError): string {
    return data.username;
  }

  /**
   * Calculate profile quality score
   * @param profile - User profile
   * @returns Quality score between 0-100
   */
  calculateProfileQuality(profile: UserProfile): number {
    let score = 0;
    let factors = 0;

    // Factor in search confidence
    score += profile.searchConfidence;
    factors++;

    // Factor in data completeness
    score += profile.dataCompleteness;
    factors++;

    // Bonus for having tweets
    if (profile.recentTweets && profile.recentTweets.length > 0) {
      score += Math.min(20, profile.recentTweets.length * 2);
      factors++;
    }

    // Bonus for having topics
    if (profile.topTopics && profile.topTopics.length > 0) {
      score += Math.min(20, profile.topTopics.length * 5);
      factors++;
    }

    return Math.round(score / factors);
  }
}
