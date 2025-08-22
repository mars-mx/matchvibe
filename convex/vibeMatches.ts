import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Helper to sort usernames for consistent storage (case-insensitive)
function sortUsers(user1: string, user2: string): [string, string] {
  const sorted = [user1.toLowerCase(), user2.toLowerCase()].sort();
  return [sorted[0], sorted[1]];
}

// Get TTL from environment (with fallback to 2 hours)
function getMatchTTL(): number {
  const ttl = process.env.VIBE_MATCH_TTL_SECONDS;
  return ttl ? Number(ttl) : 7200; // Default: 2 hours
}

// Check if match is expired based on createdAt timestamp
function isMatchExpired(createdAt: number): boolean {
  const ttlMs = getMatchTTL() * 1000;
  return Date.now() > createdAt + ttlMs;
}

// Create or replace match with fresh data
export const upsertMatch = mutation({
  args: {
    userOneTag: v.string(),
    userTwoTag: v.string(),
    score: v.number(),
    analysis: v.string(),
    recommendation: v.optional(v.string()),
    vibeType: v.optional(v.string()),
    strengths: v.array(v.string()),
    challenges: v.array(v.string()),
    sharedInterests: v.array(v.string()),
    modelUsed: v.optional(v.string()),
    sourcesUsed: v.number(),
  },
  handler: async (ctx, args) => {
    // Sort usernames for consistent storage
    const [userOne, userTwo] = sortUsers(args.userOneTag, args.userTwoTag);
    const now = Date.now();

    // Check for existing match
    const existing = await ctx.db
      .query('vibeMatches')
      .withIndex('by_users', (q) => q.eq('userOneTag', userOne).eq('userTwoTag', userTwo))
      .first();

    if (existing) {
      // Replace with fresh data and new timestamp
      await ctx.db.delete(existing._id);
    }

    // Insert fresh match with sorted usernames
    return await ctx.db.insert('vibeMatches', {
      ...args,
      userOneTag: userOne,
      userTwoTag: userTwo,
      createdAt: now,
    });
  },
});

// Get match if not expired (handles bidirectional lookup)
export const getFreshMatch = query({
  args: {
    user1: v.string(),
    user2: v.string(),
  },
  handler: async (ctx, args) => {
    // Sort usernames for consistent lookup
    const [userOne, userTwo] = sortUsers(args.user1, args.user2);

    const match = await ctx.db
      .query('vibeMatches')
      .withIndex('by_users', (q) => q.eq('userOneTag', userOne).eq('userTwoTag', userTwo))
      .first();

    if (!match) return null;

    // Check if expired based on current TTL setting
    if (isMatchExpired(match.createdAt)) {
      return null; // Match expired, needs refresh
    }

    return match;
  },
});

// Get match regardless of expiry (for debugging/admin purposes)
export const getMatch = query({
  args: {
    user1: v.string(),
    user2: v.string(),
  },
  handler: async (ctx, args) => {
    // Sort usernames for consistent lookup
    const [userOne, userTwo] = sortUsers(args.user1, args.user2);

    return await ctx.db
      .query('vibeMatches')
      .withIndex('by_users', (q) => q.eq('userOneTag', userOne).eq('userTwoTag', userTwo))
      .first();
  },
});

// Get all matches for a specific user
export const getUserMatches = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userLower = args.username.toLowerCase();

    // Get matches where user is userOne
    const matchesAsOne = await ctx.db
      .query('vibeMatches')
      .filter((q) => q.eq(q.field('userOneTag'), userLower))
      .collect();

    // Get matches where user is userTwo
    const matchesAsTwo = await ctx.db
      .query('vibeMatches')
      .filter((q) => q.eq(q.field('userTwoTag'), userLower))
      .collect();

    // Combine and sort by creation date (newest first)
    const allMatches = [...matchesAsOne, ...matchesAsTwo].sort((a, b) => b.createdAt - a.createdAt);

    // Add expiry status to each match
    return allMatches.map((match) => ({
      ...match,
      isExpired: isMatchExpired(match.createdAt),
    }));
  },
});

// Delete a specific match
export const deleteMatch = mutation({
  args: {
    user1: v.string(),
    user2: v.string(),
  },
  handler: async (ctx, args) => {
    // Sort usernames for consistent lookup
    const [userOne, userTwo] = sortUsers(args.user1, args.user2);

    const match = await ctx.db
      .query('vibeMatches')
      .withIndex('by_users', (q) => q.eq('userOneTag', userOne).eq('userTwoTag', userTwo))
      .first();

    if (match) {
      await ctx.db.delete(match._id);
      return { deleted: true, users: [userOne, userTwo] };
    }

    return { deleted: false, users: [userOne, userTwo] };
  },
});

// Clean up expired matches (can be called by a cron job)
export const deleteExpiredMatches = mutation({
  handler: async (ctx) => {
    const matches = await ctx.db.query('vibeMatches').collect();
    const deleted: string[] = [];

    for (const match of matches) {
      if (isMatchExpired(match.createdAt)) {
        await ctx.db.delete(match._id);
        deleted.push(`${match.userOneTag}-${match.userTwoTag}`);
      }
    }

    return {
      deletedCount: deleted.length,
      deleted,
      ttlSeconds: getMatchTTL(),
    };
  },
});

// Get all matches with expiry status (for debugging/monitoring)
export const getAllMatchesWithStatus = query({
  handler: async (ctx) => {
    const matches = await ctx.db.query('vibeMatches').collect();
    const ttl = getMatchTTL();
    const now = Date.now();

    return matches.map((match) => ({
      users: [match.userOneTag, match.userTwoTag],
      score: match.score,
      createdAt: match.createdAt,
      isExpired: isMatchExpired(match.createdAt),
      expiresIn: Math.max(0, match.createdAt + ttl * 1000 - now),
    }));
  },
});

// Get match statistics
export const getMatchStats = query({
  handler: async (ctx) => {
    const matches = await ctx.db.query('vibeMatches').collect();
    const ttl = getMatchTTL();

    const stats = {
      total: matches.length,
      expired: 0,
      fresh: 0,
      averageScore: 0,
      scoreDistribution: {
        perfect: 0, // 90-100
        great: 0, // 70-89
        good: 0, // 50-69
        challenging: 0, // 30-49
        incompatible: 0, // 0-29
      },
    };

    let totalScore = 0;

    for (const match of matches) {
      if (isMatchExpired(match.createdAt)) {
        stats.expired++;
      } else {
        stats.fresh++;
      }

      totalScore += match.score;

      // Score distribution
      if (match.score >= 90) stats.scoreDistribution.perfect++;
      else if (match.score >= 70) stats.scoreDistribution.great++;
      else if (match.score >= 50) stats.scoreDistribution.good++;
      else if (match.score >= 30) stats.scoreDistribution.challenging++;
      else stats.scoreDistribution.incompatible++;
    }

    stats.averageScore = matches.length > 0 ? totalScore / matches.length : 0;

    return {
      ...stats,
      ttlSeconds: ttl,
    };
  },
});
