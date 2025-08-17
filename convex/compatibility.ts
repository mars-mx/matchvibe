import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createCompatibilityResult = mutation({
  args: {
    user1Id: v.id('users'),
    user2Id: v.id('users'),
    compatibilityScore: v.number(),
    analysis1Id: v.id('vibeAnalyses'),
    analysis2Id: v.id('vibeAnalyses'),
    sharedInterests: v.array(v.string()),
    complementaryTraits: v.array(v.string()),
    potentialConflicts: v.array(v.string()),
    overallAssessment: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    return await ctx.db.insert('compatibilityResults', {
      ...args,
      createdAt: now,
    });
  },
});

export const getCompatibilityResult = query({
  args: { user1Id: v.id('users'), user2Id: v.id('users') },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('compatibilityResults')
      .withIndex('by_users', (q) => q.eq('user1Id', args.user1Id).eq('user2Id', args.user2Id))
      .order('desc')
      .first();

    if (result) return result;

    return await ctx.db
      .query('compatibilityResults')
      .withIndex('by_users', (q) => q.eq('user1Id', args.user2Id).eq('user2Id', args.user1Id))
      .order('desc')
      .first();
  },
});

export const getCompatibilityResultById = query({
  args: { resultId: v.id('compatibilityResults') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.resultId);
  },
});

export const getUserCompatibilityHistory = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const results1 = await ctx.db
      .query('compatibilityResults')
      .withIndex('by_user1', (q) => q.eq('user1Id', args.userId))
      .order('desc')
      .collect();

    const results2 = await ctx.db
      .query('compatibilityResults')
      .withIndex('by_user2', (q) => q.eq('user2Id', args.userId))
      .order('desc')
      .collect();

    return [...results1, ...results2].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
});
