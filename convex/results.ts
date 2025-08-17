import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createResult = mutation({
  args: {
    user_one_username: v.string(),
    user_two_username: v.string(),
    compatibilityScore: v.number(),
    sharedInterests: v.array(v.string()),
    complementaryTraits: v.array(v.string()),
    potentialConflicts: v.array(v.string()),
    overallAssessment: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    return await ctx.db.insert('results', {
      ...args,
      createdAt: now,
    });
  },
});

export const getResult = query({
  args: { user_one_username: v.string(), user_two_username: v.string() },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('results')
      .withIndex('by_users', (q) =>
        q
          .eq('user_one_username', args.user_one_username)
          .eq('user_two_username', args.user_two_username)
      )
      .order('desc')
      .first();

    if (result) return result;

    return await ctx.db
      .query('results')
      .withIndex('by_users', (q) =>
        q
          .eq('user_one_username', args.user_two_username)
          .eq('user_two_username', args.user_one_username)
      )
      .order('desc')
      .first();
  },
});

export const getResultById = query({
  args: { resultId: v.id('results') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.resultId);
  },
});

export const getUserResultHistory = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const results1 = await ctx.db
      .query('results')
      .withIndex('by_user1', (q) => q.eq('user_one_username', args.username))
      .order('desc')
      .collect();

    const results2 = await ctx.db
      .query('results')
      .withIndex('by_user2', (q) => q.eq('user_two_username', args.username))
      .order('desc')
      .collect();

    return [...results1, ...results2].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
});
