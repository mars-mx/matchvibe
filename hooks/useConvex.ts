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

export function useGetUserByUsername(username: string) {
  return useQuery(api.users.getUserByUsername, { username });
}

export function useGetUser(userId: Id<'users'> | undefined) {
  return useQuery(api.users.getUser, userId ? { userId } : 'skip');
}

export function useCreateResult() {
  return useMutation(api.results.createResult);
}

export function useGetResult(
  user_one_username: string | undefined,
  user_two_username: string | undefined
) {
  return useQuery(
    api.results.getResult,
    user_one_username && user_two_username ? { user_one_username, user_two_username } : 'skip'
  );
}

export function useGetResultById(resultId: Id<'results'> | undefined) {
  return useQuery(api.results.getResultById, resultId ? { resultId } : 'skip');
}

export function useGetUserResultHistory(username: string | undefined) {
  return useQuery(api.results.getUserResultHistory, username ? { username } : 'skip');
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
