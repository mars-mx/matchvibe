import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  userProfiles: defineTable({
    // Identity
    username: v.string(), // Unique X username (without @)
    displayName: v.optional(v.string()),

    // Content Style
    primaryContentType: v.optional(v.string()), // 'shitposts', 'serious', 'mixed', 'news', 'personal'
    humorStyle: v.optional(v.string()), // 'sarcastic', 'wholesome', 'edgy', 'dry', 'none'
    tone: v.optional(v.string()), // 'positive', 'negative', 'neutral', 'mixed'
    usesEmojis: v.optional(v.boolean()),
    formality: v.optional(v.string()), // 'very_formal', 'formal', 'casual', 'very_casual'

    // Rating Scores (0-1 values)
    shitpostRating: v.optional(v.number()), // 0=never shitposts, 1=constantly shitposts
    memeRating: v.optional(v.number()), // 0=never uses memes, 1=very frequently
    qualityRating: v.optional(v.number()), // 0=never quality content, 1=mostly quality

    // Topics & Traits
    topTopics: v.array(v.string()),
    notableTraits: v.array(v.string()),

    // Data Quality Metrics
    searchConfidence: v.number(), // 0-100
    dataCompleteness: v.number(), // 0-100

    // Timestamp (Unix milliseconds)
    createdAt: v.number(),
  })
    .index('by_username', ['username'])
    .index('by_created', ['createdAt']),

  vibeMatches: defineTable({
    // User identifiers (always sorted alphabetically)
    userOneTag: v.string(),
    userTwoTag: v.string(),

    // Analysis Results
    score: v.number(), // 0-100 compatibility score
    analysis: v.string(),
    recommendation: v.optional(v.string()),
    vibeType: v.optional(v.string()), // 'perfect_match', 'complementary', 'growth', 'challenging', 'incompatible'

    // Arrays
    strengths: v.array(v.string()),
    challenges: v.array(v.string()),
    sharedInterests: v.array(v.string()),

    // Metadata
    modelUsed: v.optional(v.string()),
    sourcesUsed: v.number(),

    // Timestamp (Unix milliseconds)
    createdAt: v.number(),
  })
    .index('by_users', ['userOneTag', 'userTwoTag'])
    .index('by_created', ['createdAt']),
});
