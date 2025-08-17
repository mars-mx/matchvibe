import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createUser = mutation({
  args: {
    twitterHandle: v.string(),
    displayName: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    tweetCount: v.optional(v.number()),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_twitter_handle', (q) => q.eq('twitterHandle', args.twitterHandle))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    return await ctx.db.insert('users', {
      ...args,
      createdAt: now,
      lastUpdated: now,
    });
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id('users'),
    displayName: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    tweetCount: v.optional(v.number()),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updateData } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(userId, {
      ...updateData,
      lastUpdated: now,
    });

    return userId;
  },
});

export const getUserByHandle = query({
  args: { twitterHandle: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_twitter_handle', (q) => q.eq('twitterHandle', args.twitterHandle))
      .first();
  },
});

export const getUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
