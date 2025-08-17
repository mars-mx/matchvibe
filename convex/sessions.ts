import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

export const createSession = mutation({
  args: {
    sessionId: v.string(),
    user1Handle: v.string(),
    user2Handle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    return await ctx.db.insert('sessions', {
      ...args,
      status: 'analyzing',
      createdAt: now,
    });
  },
});

export const updateSessionStatus = mutation({
  args: {
    sessionId: v.string(),
    status: v.union(v.literal('analyzing'), v.literal('completed'), v.literal('error')),
    compatibilityResultId: v.optional(v.id('compatibilityResults')),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_session_id', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!session) {
      throw new Error('Session not found');
    }

    const updateData: {
      status: 'analyzing' | 'completed' | 'error';
      compatibilityResultId?: Id<'compatibilityResults'>;
      errorMessage?: string;
      completedAt?: string;
    } = {
      status: args.status,
    };

    if (args.compatibilityResultId) {
      updateData.compatibilityResultId = args.compatibilityResultId;
    }

    if (args.errorMessage) {
      updateData.errorMessage = args.errorMessage;
    }

    if (args.status === 'completed' || args.status === 'error') {
      updateData.completedAt = new Date().toISOString();
    }

    await ctx.db.patch(session._id, updateData);
    return session._id;
  },
});

export const getSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_session_id', (q) => q.eq('sessionId', args.sessionId))
      .first();
  },
});

export const getRecentSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db.query('sessions').order('desc').take(limit);
  },
});
