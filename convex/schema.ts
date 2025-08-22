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

    // 15 Personality Dimensions (0-1 values)
    // Emotional & Mood
    positivityRating: v.optional(v.number()), // 0=negative/pessimistic, 1=positive/optimistic
    empathyRating: v.optional(v.number()), // 0=self-focused, 1=highly empathetic

    // Interaction Style
    engagementRating: v.optional(v.number()), // 0=passive observer, 1=active engager
    debateRating: v.optional(v.number()), // 0=avoids conflict, 1=loves debates

    // Content Style
    shitpostRating: v.optional(v.number()), // 0=never shitposts, 1=constantly shitposts
    memeRating: v.optional(v.number()), // 0=never uses memes, 1=very frequently
    intellectualRating: v.optional(v.number()), // 0=surface-level, 1=deep/analytical (renamed from qualityRating)

    // Topic Focus
    politicalRating: v.optional(v.number()), // 0=apolitical, 1=highly political
    personalSharingRating: v.optional(v.number()), // 0=impersonal, 1=personal oversharer
    inspirationalQuotesRating: v.optional(v.number()), // 0=never posts quotes, 1=daily quotes

    // Social Energy
    extroversionRating: v.optional(v.number()), // 0=introverted, 1=extroverted
    authenticityRating: v.optional(v.number()), // 0=performative, 1=raw/authentic

    // Values
    optimismRating: v.optional(v.number()), // 0=doomer, 1=extreme optimist

    // Communication
    humorRating: v.optional(v.number()), // 0=serious only, 1=constantly joking
    aiGeneratedRating: v.optional(v.number()), // 0=clearly human, 1=likely AI-generated

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
