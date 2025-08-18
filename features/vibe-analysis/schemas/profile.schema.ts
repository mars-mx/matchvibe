import { z } from 'zod';

/**
 * Schema for user profile data fetched from X via Grok
 */
export const userProfileSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  displayName: z.string().nullable(),

  recentTweets: z
    .array(
      z.object({
        text: z.string(),
        isReply: z.boolean().optional(),
        hasMedia: z.boolean().optional(),
      })
    )
    .nullable(),

  contentStyle: z.object({
    primaryContentType: z.enum(['shitposts', 'serious', 'mixed', 'news', 'personal']).nullable(),
    humorStyle: z.enum(['sarcastic', 'wholesome', 'edgy', 'dry', 'none']).nullable(),
    tone: z.enum(['positive', 'negative', 'neutral', 'mixed']).nullable(),
    usesEmojis: z.boolean().nullable(),
    formality: z.enum(['very_formal', 'formal', 'casual', 'very_casual']).nullable(),
    shitpostRating: z.number().min(0).max(1).nullable(),
    memeRating: z.number().min(0).max(1).nullable(),
    qualityRating: z.number().min(0).max(1).nullable(),
  }),

  topTopics: z.array(z.string()).nullable(),

  notableTraits: z.array(z.string()).nullable(),

  searchConfidence: z.number().min(0).max(100),
  dataCompleteness: z.number().min(0).max(100),

  // Optional citations field from Grok search
  // Preprocessor handles various formats Grok might return
  citations: z
    .preprocess(
      (val) => {
        // Handle various formats Grok might return
        if (val === null || val === undefined) {
          return null;
        }

        // Handle string values like "none", "", "[]", etc.
        if (typeof val === 'string') {
          if (val === '' || val === 'none' || val === 'null' || val === '[]') {
            return null;
          }
          // Try to parse if it looks like JSON
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : null;
          } catch {
            return null;
          }
        }

        // Handle arrays
        if (Array.isArray(val)) {
          // Handle case where array contains strings (e.g., ["none"] or [""])
          if (val.every((item) => typeof item === 'string')) {
            // If all elements are strings, it's likely an error response
            return null;
          }

          // Filter out invalid entries (strings, nulls, etc.)
          const validCitations = val.filter(
            (item) => typeof item === 'object' && item !== null && !Array.isArray(item)
          );

          // Return null if no valid citations
          return validCitations.length > 0 ? validCitations : null;
        }

        // For any other type, return null
        return null;
      },
      z
        .array(
          z.object({
            id: z.number().optional(),
            source: z.string().optional(),
            url: z.string().optional(),
            text: z.string().optional(),
          })
        )
        .nullable()
    )
    .optional(),
});

/**
 * Schema for profile fetch error
 */
export const userProfileErrorSchema = z.object({
  error: z.string(),
  username: z.string(),
});

/**
 * Schema for the matching result (enhanced from vibe analysis)
 */
export const matchingResultSchema = z.object({
  score: z.number().min(0).max(100),
  analysis: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  sharedInterests: z.array(z.string()).default([]),
  vibeType: z.enum(['perfect_match', 'complementary', 'growth', 'challenging', 'incompatible']),
  recommendation: z.string(),
  metadata: z.object({
    userOne: z.string().min(1),
    userTwo: z.string().min(1),
    timestamp: z.string(),
    modelUsed: z.string().optional(),
  }),
});

// Type exports
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserProfileError = z.infer<typeof userProfileErrorSchema>;
export type MatchingResult = z.infer<typeof matchingResultSchema>;
