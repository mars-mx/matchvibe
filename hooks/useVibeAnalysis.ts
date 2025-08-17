'use client';

import { useState, useCallback } from 'react';
import {
  useCreateUser,
  useCreateResult,
  useCreateMatchup,
  useUpdateMatchupStatus,
} from './useConvex';
import type { Id } from '@/convex/_generated/dataModel';

export interface UserData {
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  tweetCount?: number;
  verified?: boolean;
}

export function useVibeAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentMatchup, setCurrentMatchup] = useState<string | null>(null);

  const createUser = useCreateUser();
  const createResult = useCreateResult();
  const createMatchup = useCreateMatchup();
  const updateMatchupStatus = useUpdateMatchupStatus();

  const analyzeUser = useCallback(
    async (userData: UserData): Promise<Id<'users'>> => {
      try {
        const userId = await createUser(userData);
        return userId;
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },
    [createUser]
  );

  const analyzeCompatibility = useCallback(
    async (
      user1Id: Id<'users'>,
      user2Id: Id<'users'>,
      compatibilityData: {
        compatibilityScore: number;
        sharedInterests: string[];
        complementaryTraits: string[];
        potentialConflicts: string[];
        overallAssessment: string;
      }
    ) => {
      try {
        const resultId = await createResult({
          user1Id,
          user2Id,
          ...compatibilityData,
        });
        return resultId;
      } catch (error) {
        console.error('Error creating result:', error);
        throw error;
      }
    },
    [createResult]
  );

  const startAnalysisMatchup = useCallback(
    async (user_one_username: string, user_two_username?: string) => {
      try {
        setIsAnalyzing(true);
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        await createMatchup({
          sessionId,
          user_one_username,
          user_two_username,
        });

        setCurrentMatchup(sessionId);
        return sessionId;
      } catch (error) {
        console.error('Error starting analysis session:', error);
        setIsAnalyzing(false);
        throw error;
      }
    },
    [createMatchup]
  );

  const completeAnalysisMatchup = useCallback(
    async (sessionId: string, resultId?: Id<'results'>, errorMessage?: string) => {
      try {
        await updateMatchupStatus({
          sessionId,
          status: errorMessage ? 'error' : 'completed',
          resultId,
          errorMessage,
        });

        setIsAnalyzing(false);
        setCurrentMatchup(null);
      } catch (error) {
        console.error('Error completing analysis session:', error);
        throw error;
      }
    },
    [updateMatchupStatus]
  );

  return {
    isAnalyzing,
    currentMatchup,
    analyzeUser,
    analyzeCompatibility,
    startAnalysisMatchup,
    completeAnalysisMatchup,
  };
}
