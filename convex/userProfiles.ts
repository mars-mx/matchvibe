import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get TTL from environment (with fallback to 1 hour)
function getProfileTTL(): number {
  const ttl = process.env.USER_PROFILE_TTL_SECONDS;
  return ttl ? Number(ttl) : 3600; // Default: 1 hour
}

// Check if profile is expired based on createdAt timestamp
function isProfileExpired(createdAt: number): boolean {
  const ttlMs = getProfileTTL() * 1000;
  return Date.now() > createdAt + ttlMs;
}

// Create or replace profile with fresh data
export const upsertProfile = mutation({
  args: {
    username: v.string(),
    displayName: v.optional(v.string()),
    primaryContentType: v.optional(v.string()),
    humorStyle: v.optional(v.string()),
    tone: v.optional(v.string()),
    usesEmojis: v.optional(v.boolean()),
    formality: v.optional(v.string()),
    shitpostRating: v.optional(v.number()),
    memeRating: v.optional(v.number()),
    qualityRating: v.optional(v.number()),
    topTopics: v.array(v.string()),
    notableTraits: v.array(v.string()),
    searchConfidence: v.number(),
    dataCompleteness: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing profile
    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .first();

    if (existing) {
      // Replace with fresh data and new timestamp
      await ctx.db.delete(existing._id);
    }

    // Insert fresh profile with current timestamp
    return await ctx.db.insert('userProfiles', {
      ...args,
      createdAt: now,
    });
  },
});

// Get profile if not expired (returns null if expired or not found)
export const getFreshProfile = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .first();

    if (!profile) return null;

    // Check if expired based on current TTL setting
    if (isProfileExpired(profile.createdAt)) {
      return null; // Profile expired, needs refresh
    }

    return profile;
  },
});

// Get profile regardless of expiry (for debugging/admin purposes)
export const getProfile = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('userProfiles')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .first();
  },
});

// Delete a specific profile
export const deleteProfile = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .first();

    if (profile) {
      await ctx.db.delete(profile._id);
      return { deleted: true, username: args.username };
    }

    return { deleted: false, username: args.username };
  },
});

// Clean up expired profiles (can be called by a cron job)
export const deleteExpiredProfiles = mutation({
  handler: async (ctx) => {
    const profiles = await ctx.db.query('userProfiles').collect();
    const deleted: string[] = [];

    for (const profile of profiles) {
      if (isProfileExpired(profile.createdAt)) {
        await ctx.db.delete(profile._id);
        deleted.push(profile.username);
      }
    }

    return {
      deletedCount: deleted.length,
      deleted,
      ttlSeconds: getProfileTTL(),
    };
  },
});

// Get all profiles with expiry status (for debugging/monitoring)
export const getAllProfilesWithStatus = query({
  handler: async (ctx) => {
    const profiles = await ctx.db.query('userProfiles').collect();
    const ttl = getProfileTTL();
    const now = Date.now();

    return profiles.map((profile) => ({
      username: profile.username,
      createdAt: profile.createdAt,
      isExpired: isProfileExpired(profile.createdAt),
      expiresIn: Math.max(0, profile.createdAt + ttl * 1000 - now),
      searchConfidence: profile.searchConfidence,
      dataCompleteness: profile.dataCompleteness,
    }));
  },
});
