'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// User Profile hooks
export function useUpsertProfile() {
  return useMutation(api.userProfiles.upsertProfile);
}

export function useGetProfile(username: string | undefined) {
  return useQuery(api.userProfiles.getProfile, username ? { username } : 'skip');
}

export function useGetFreshProfile(username: string | undefined) {
  return useQuery(api.userProfiles.getFreshProfile, username ? { username } : 'skip');
}

export function useGetAllProfilesWithStatus() {
  return useQuery(api.userProfiles.getAllProfilesWithStatus);
}

// Vibe Match hooks
export function useUpsertMatch() {
  return useMutation(api.vibeMatches.upsertMatch);
}

export function useGetMatch(user1: string | undefined, user2: string | undefined) {
  return useQuery(api.vibeMatches.getMatch, user1 && user2 ? { user1, user2 } : 'skip');
}

export function useGetFreshMatch(user1: string | undefined, user2: string | undefined) {
  return useQuery(api.vibeMatches.getFreshMatch, user1 && user2 ? { user1, user2 } : 'skip');
}

export function useGetUserMatches(username: string | undefined) {
  return useQuery(api.vibeMatches.getUserMatches, username ? { username } : 'skip');
}

export function useGetMatchStats() {
  return useQuery(api.vibeMatches.getMatchStats);
}
