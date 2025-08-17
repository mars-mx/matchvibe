import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    username: v.string(),
    displayName: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    tweetCount: v.optional(v.number()),
    verified: v.optional(v.boolean()),
    createdAt: v.string(),
    created_at: v.string(),
    lastUpdated: v.string(),
  }).index('by_username', ['username']),

  results: defineTable({
    user_one_username: v.string(),
    user_two_username: v.string(),
    compatibilityScore: v.number(),
    sharedInterests: v.array(v.string()),
    complementaryTraits: v.array(v.string()),
    potentialConflicts: v.array(v.string()),
    overallAssessment: v.string(),
    createdAt: v.string(),
  })
    .index('by_users', ['user_one_username', 'user_two_username'])
    .index('by_user1', ['user_one_username'])
    .index('by_user2', ['user_two_username']),

  matchups: defineTable({
    sessionId: v.string(),
    user_one_username: v.string(),
    user_two_username: v.optional(v.string()),
    status: v.union(v.literal('analyzing'), v.literal('completed'), v.literal('error')),
    resultId: v.optional(v.id('results')),
    errorMessage: v.optional(v.string()),
    createdAt: v.string(),
    completedAt: v.optional(v.string()),
  }).index('by_matchup_id', ['sessionId']),
});
