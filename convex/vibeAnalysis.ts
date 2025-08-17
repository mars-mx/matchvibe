import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createVibeAnalysis = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    return await ctx.db.insert('vibeAnalyses', {
      ...args,
      createdAt: now,
    });
  },
});

export const getVibeAnalysisByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('vibeAnalyses')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .first();
  },
});

export const getAllVibeAnalysesByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('vibeAnalyses')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();
  },
});
