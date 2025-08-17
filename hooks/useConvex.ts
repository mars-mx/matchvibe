'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export function useCreateUser() {
  return useMutation(api.users.createUser);
}

export function useUpdateUser() {
  return useMutation(api.users.updateUser);
}

export function useGetUserByHandle(twitterHandle: string) {
  return useQuery(api.users.getUserByHandle, { twitterHandle });
}

export function useGetUser(userId: Id<'users'> | undefined) {
  return useQuery(api.users.getUser, userId ? { userId } : 'skip');
}

export function useCreateVibeAnalysis() {
  return useMutation(api.vibeAnalysis.createVibeAnalysis);
}

export function useGetVibeAnalysisByUser(userId: Id<'users'> | undefined) {
  return useQuery(api.vibeAnalysis.getVibeAnalysisByUser, userId ? { userId } : 'skip');
}

export function useGetAllVibeAnalysesByUser(userId: Id<'users'> | undefined) {
  return useQuery(api.vibeAnalysis.getAllVibeAnalysesByUser, userId ? { userId } : 'skip');
}

export function useCreateCompatibilityResult() {
  return useMutation(api.compatibility.createCompatibilityResult);
}

export function useGetCompatibilityResult(
  user1Id: Id<'users'> | undefined,
  user2Id: Id<'users'> | undefined
) {
  return useQuery(
    api.compatibility.getCompatibilityResult,
    user1Id && user2Id ? { user1Id, user2Id } : 'skip'
  );
}

export function useGetCompatibilityResultById(resultId: Id<'compatibilityResults'> | undefined) {
  return useQuery(api.compatibility.getCompatibilityResultById, resultId ? { resultId } : 'skip');
}

export function useGetUserCompatibilityHistory(userId: Id<'users'> | undefined) {
  return useQuery(api.compatibility.getUserCompatibilityHistory, userId ? { userId } : 'skip');
}

export function useCreateSession() {
  return useMutation(api.sessions.createSession);
}

export function useUpdateSessionStatus() {
  return useMutation(api.sessions.updateSessionStatus);
}

export function useGetSession(sessionId: string | undefined) {
  return useQuery(api.sessions.getSession, sessionId ? { sessionId } : 'skip');
}

export function useGetRecentSessions(limit?: number) {
  return useQuery(api.sessions.getRecentSessions, { limit });
}
