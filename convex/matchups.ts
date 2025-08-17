import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

export const createMatchup = mutation({
  args: {
    sessionId: v.string(),
    user1Handle: v.string(),
    user2Handle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    return await ctx.db.insert('matchups', {
      ...args,
      status: 'analyzing',
      createdAt: now,
    });
  },
});

export const updateMatchupStatus = mutation({
  args: {
    sessionId: v.string(),
    status: v.union(v.literal('analyzing'), v.literal('completed'), v.literal('error')),
    resultId: v.optional(v.id('results')),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const matchup = await ctx.db
      .query('matchups')
      .withIndex('by_matchup_id', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!matchup) {
      throw new Error('Matchup not found');
    }

    const updateData: {
      status: 'analyzing' | 'completed' | 'error';
      resultId?: Id<'results'>;
      errorMessage?: string;
      completedAt?: string;
    } = {
      status: args.status,
    };

    if (args.resultId) {
      updateData.resultId = args.resultId;
    }

    if (args.errorMessage) {
      updateData.errorMessage = args.errorMessage;
    }

    if (args.status === 'completed' || args.status === 'error') {
      updateData.completedAt = new Date().toISOString();
    }

    await ctx.db.patch(matchup._id, updateData);
    return matchup._id;
  },
});

export const getMatchup = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('matchups')
      .withIndex('by_matchup_id', (q) => q.eq('sessionId', args.sessionId))
      .first();
  },
});

export const getRecentMatchups = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db.query('matchups').order('desc').take(limit);
  },
});
