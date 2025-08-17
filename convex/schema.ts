import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    twitterHandle: v.string(),
    displayName: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    tweetCount: v.optional(v.number()),
    verified: v.optional(v.boolean()),
    createdAt: v.string(),
    lastUpdated: v.string(),
  }).index('by_twitter_handle', ['twitterHandle']),

  vibeAnalyses: defineTable({
    userId: v.id('users'),
    vibeScore: v.number(),
    personalityTraits: v.array(v.string()),
    interests: v.array(v.string()),
    communicationStyle: v.string(),
    sentiment: v.string(),
    analysisData: v.optional(
      v.object({
        tweetSample: v.array(v.string()),
        confidenceScore: v.number(),
        lastAnalyzed: v.string(),
      })
    ),
    createdAt: v.string(),
  }).index('by_user', ['userId']),

  compatibilityResults: defineTable({
    user1Id: v.id('users'),
    user2Id: v.id('users'),
    compatibilityScore: v.number(),
    analysis1Id: v.id('vibeAnalyses'),
    analysis2Id: v.id('vibeAnalyses'),
    sharedInterests: v.array(v.string()),
    complementaryTraits: v.array(v.string()),
    potentialConflicts: v.array(v.string()),
    overallAssessment: v.string(),
    createdAt: v.string(),
  })
    .index('by_users', ['user1Id', 'user2Id'])
    .index('by_user1', ['user1Id'])
    .index('by_user2', ['user2Id']),

  sessions: defineTable({
    sessionId: v.string(),
    user1Handle: v.string(),
    user2Handle: v.optional(v.string()),
    status: v.union(v.literal('analyzing'), v.literal('completed'), v.literal('error')),
    compatibilityResultId: v.optional(v.id('compatibilityResults')),
    errorMessage: v.optional(v.string()),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
  }).index('by_session_id', ['sessionId']),
});
