/**
 * Convex Cache Service for Vibe Analysis
 * Handles caching of user profiles and match results with configurable TTL
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { UserProfile, VibeAnalysisResult } from '@/features/vibe-analysis/types';
import { createChildLogger } from '@/lib/logger';

const logger = createChildLogger('ConvexCacheService');

/**
 * Cache service for storing and retrieving vibe analysis data
 * Uses Convex database with TTL-based expiration
 */
export class ConvexCacheService {
  private convex: ConvexHttpClient;

  constructor() {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
    }
    this.convex = new ConvexHttpClient(convexUrl);
  }

  /**
   * Get cached user profile if not expired
   * @param username - X username (without @)
   * @returns UserProfile if fresh, null if expired or not found
   */
  async getCachedProfile(username: string): Promise<UserProfile | null> {
    try {
      const profile = await this.convex.query(api.userProfiles.getFreshProfile, {
        username: username.toLowerCase(),
      });

      if (!profile) {
        logger.debug({ username }, 'No cached profile found or profile expired');
        return null;
      }

      logger.info({ username, createdAt: profile.createdAt }, 'Found cached profile');

      // Transform Convex profile to UserProfile type
      return this.convexProfileToUserProfile(profile);
    } catch (error) {
      logger.error({ error, username }, 'Error fetching cached profile');
      return null;
    }
  }

  /**
   * Cache a user profile with TTL
   * @param profile - UserProfile to cache
   */
  async cacheProfile(profile: UserProfile): Promise<void> {
    try {
      await this.convex.mutation(api.userProfiles.upsertProfile, {
        username: profile.username.toLowerCase(),
        displayName: profile.displayName ?? undefined,
        primaryContentType: profile.contentStyle.primaryContentType ?? undefined,
        humorStyle: profile.contentStyle.humorStyle ?? undefined,
        tone: profile.contentStyle.tone ?? undefined,
        usesEmojis: profile.contentStyle.usesEmojis ?? undefined,
        formality: profile.contentStyle.formality ?? undefined,
        shitpostRating: profile.contentStyle.shitpostRating ?? undefined,
        memeRating: profile.contentStyle.memeRating ?? undefined,
        intellectualRating: profile.contentStyle.intellectualRating ?? undefined,
        // New personality dimensions
        positivityRating: profile.contentStyle.positivityRating ?? undefined,
        empathyRating: profile.contentStyle.empathyRating ?? undefined,
        engagementRating: profile.contentStyle.engagementRating ?? undefined,
        debateRating: profile.contentStyle.debateRating ?? undefined,
        politicalRating: profile.contentStyle.politicalRating ?? undefined,
        personalSharingRating: profile.contentStyle.personalSharingRating ?? undefined,
        inspirationalQuotesRating: profile.contentStyle.inspirationalQuotesRating ?? undefined,
        extroversionRating: profile.contentStyle.extroversionRating ?? undefined,
        authenticityRating: profile.contentStyle.authenticityRating ?? undefined,
        optimismRating: profile.contentStyle.optimismRating ?? undefined,
        humorRating: profile.contentStyle.humorRating ?? undefined,
        aiGeneratedRating: profile.contentStyle.aiGeneratedRating ?? undefined,
        topTopics: profile.topTopics ?? [],
        notableTraits: profile.notableTraits ?? [],
        searchConfidence: profile.searchConfidence,
        dataCompleteness: profile.dataCompleteness,
      });

      logger.info({ username: profile.username }, 'Profile cached successfully');
    } catch (error) {
      logger.error({ error, username: profile.username }, 'Error caching profile');
      // Don't throw - caching failure shouldn't break the flow
    }
  }

  /**
   * Get cached match result if not expired
   * @param user1 - First username
   * @param user2 - Second username
   * @returns VibeAnalysisResult if fresh, null if expired or not found
   */
  async getCachedMatch(user1: string, user2: string): Promise<VibeAnalysisResult | null> {
    try {
      const match = await this.convex.query(api.vibeMatches.getFreshMatch, {
        user1: user1.toLowerCase(),
        user2: user2.toLowerCase(),
      });

      if (!match) {
        logger.debug({ user1, user2 }, 'No cached match found or match expired');
        return null;
      }

      logger.info(
        { users: [match.userOneTag, match.userTwoTag], createdAt: match.createdAt },
        'Found cached match'
      );

      // Transform Convex match to VibeAnalysisResult type
      return this.convexMatchToVibeResult(match);
    } catch (error) {
      logger.error({ error, user1, user2 }, 'Error fetching cached match');
      return null;
    }
  }

  /**
   * Cache a match result with TTL
   * @param result - VibeAnalysisResult to cache
   */
  async cacheMatch(result: VibeAnalysisResult): Promise<void> {
    try {
      await this.convex.mutation(api.vibeMatches.upsertMatch, {
        userOneTag: result.metadata.userOne.toLowerCase(),
        userTwoTag: result.metadata.userTwo.toLowerCase(),
        score: result.score,
        analysis: result.analysis,
        recommendation: result.recommendation,
        vibeType: result.vibeType,
        strengths: result.strengths,
        challenges: result.challenges,
        sharedInterests: result.sharedInterests,
        modelUsed: result.metadata.modelUsed ?? 'grok-3-mini',
        sourcesUsed: result.metadata.sourcesUsed,
      });

      logger.info(
        { users: [result.metadata.userOne, result.metadata.userTwo], score: result.score },
        'Match cached successfully'
      );
    } catch (error) {
      logger.error(
        { error, users: [result.metadata.userOne, result.metadata.userTwo] },
        'Error caching match'
      );
      // Don't throw - caching failure shouldn't break the flow
    }
  }

  /**
   * Transform Convex profile document to UserProfile type
   */
  private convexProfileToUserProfile(profile: any): UserProfile {
    return {
      username: profile.username,
      displayName: profile.displayName ?? null,
      recentTweets: null, // Not stored in cache
      contentStyle: {
        primaryContentType: profile.primaryContentType ?? null,
        humorStyle: profile.humorStyle ?? null,
        tone: profile.tone ?? null,
        usesEmojis: profile.usesEmojis ?? null,
        formality: profile.formality ?? null,
        shitpostRating: profile.shitpostRating ?? null,
        memeRating: profile.memeRating ?? null,
        intellectualRating: profile.intellectualRating ?? null,
        // New personality dimensions
        positivityRating: profile.positivityRating ?? null,
        empathyRating: profile.empathyRating ?? null,
        engagementRating: profile.engagementRating ?? null,
        debateRating: profile.debateRating ?? null,
        politicalRating: profile.politicalRating ?? null,
        personalSharingRating: profile.personalSharingRating ?? null,
        inspirationalQuotesRating: profile.inspirationalQuotesRating ?? null,
        extroversionRating: profile.extroversionRating ?? null,
        authenticityRating: profile.authenticityRating ?? null,
        optimismRating: profile.optimismRating ?? null,
        humorRating: profile.humorRating ?? null,
        aiGeneratedRating: profile.aiGeneratedRating ?? null,
      },
      topTopics: profile.topTopics?.length > 0 ? profile.topTopics : null,
      notableTraits: profile.notableTraits?.length > 0 ? profile.notableTraits : null,
      searchConfidence: profile.searchConfidence,
      dataCompleteness: profile.dataCompleteness,
    };
  }

  /**
   * Transform Convex match document to VibeAnalysisResult type
   */
  private convexMatchToVibeResult(match: any): VibeAnalysisResult {
    return {
      score: match.score,
      analysis: match.analysis,
      strengths: match.strengths,
      challenges: match.challenges,
      sharedInterests: match.sharedInterests,
      vibeType: match.vibeType as any,
      recommendation: match.recommendation,
      metadata: {
        userOne: match.userOneTag,
        userTwo: match.userTwoTag,
        sourcesUsed: match.sourcesUsed,
        timestamp: new Date(match.createdAt).toISOString(),
        modelUsed: match.modelUsed ?? 'grok-3-mini',
      },
    };
  }

  /**
   * Clear expired entries (for maintenance)
   */
  async clearExpiredEntries(): Promise<{
    profiles: { deletedCount: number };
    matches: { deletedCount: number };
  }> {
    try {
      const [profiles, matches] = await Promise.all([
        this.convex.mutation(api.userProfiles.deleteExpiredProfiles),
        this.convex.mutation(api.vibeMatches.deleteExpiredMatches),
      ]);

      logger.info(
        {
          profilesDeleted: profiles.deletedCount,
          matchesDeleted: matches.deletedCount,
        },
        'Expired entries cleared'
      );

      return { profiles, matches };
    } catch (error) {
      logger.error({ error }, 'Error clearing expired entries');
      throw error;
    }
  }
}

// Export singleton instance
export const convexCache = new ConvexCacheService();
