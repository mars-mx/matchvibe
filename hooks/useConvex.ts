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

export function useCreateResult() {
  return useMutation(api.results.createResult);
}

export function useGetResult(user1Id: Id<'users'> | undefined, user2Id: Id<'users'> | undefined) {
  return useQuery(api.results.getResult, user1Id && user2Id ? { user1Id, user2Id } : 'skip');
}

export function useGetResultById(resultId: Id<'results'> | undefined) {
  return useQuery(api.results.getResultById, resultId ? { resultId } : 'skip');
}

export function useGetUserResultHistory(userId: Id<'users'> | undefined) {
  return useQuery(api.results.getUserResultHistory, userId ? { userId } : 'skip');
}

export function useCreateMatchup() {
  return useMutation(api.matchups.createMatchup);
}

export function useUpdateMatchupStatus() {
  return useMutation(api.matchups.updateMatchupStatus);
}

export function useGetMatchup(sessionId: string | undefined) {
  return useQuery(api.matchups.getMatchup, sessionId ? { sessionId } : 'skip');
}

export function useGetRecentMatchups(limit?: number) {
  return useQuery(api.matchups.getRecentMatchups, { limit });
}
