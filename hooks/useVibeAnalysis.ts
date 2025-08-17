'use client';

import { useState, useCallback } from 'react';
import {
  useCreateUser,
  useCreateVibeAnalysis,
  useCreateCompatibilityResult,
  useCreateSession,
  useUpdateSessionStatus,
} from './useConvex';
import type { Id } from '@/convex/_generated/dataModel';

export interface UserData {
  twitterHandle: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  tweetCount?: number;
  verified?: boolean;
}

export interface VibeAnalysisData {
  vibeScore: number;
  personalityTraits: string[];
  interests: string[];
  communicationStyle: string;
  sentiment: string;
  analysisData?: {
    tweetSample: string[];
    confidenceScore: number;
    lastAnalyzed: string;
  };
}

export function useVibeAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const createUser = useCreateUser();
  const createVibeAnalysis = useCreateVibeAnalysis();
  const createCompatibilityResult = useCreateCompatibilityResult();
  const createSession = useCreateSession();
  const updateSessionStatus = useUpdateSessionStatus();

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

  const createVibeScore = useCallback(
    async (userId: Id<'users'>, analysisData: VibeAnalysisData) => {
      try {
        const analysisId = await createVibeAnalysis({
          userId,
          ...analysisData,
        });
        return analysisId;
      } catch (error) {
        console.error('Error creating vibe analysis:', error);
        throw error;
      }
    },
    [createVibeAnalysis]
  );

  const analyzeCompatibility = useCallback(
    async (
      user1Id: Id<'users'>,
      user2Id: Id<'users'>,
      analysis1Id: Id<'vibeAnalyses'>,
      analysis2Id: Id<'vibeAnalyses'>,
      compatibilityData: {
        compatibilityScore: number;
        sharedInterests: string[];
        complementaryTraits: string[];
        potentialConflicts: string[];
        overallAssessment: string;
      }
    ) => {
      try {
        const resultId = await createCompatibilityResult({
          user1Id,
          user2Id,
          analysis1Id,
          analysis2Id,
          ...compatibilityData,
        });
        return resultId;
      } catch (error) {
        console.error('Error creating compatibility result:', error);
        throw error;
      }
    },
    [createCompatibilityResult]
  );

  const startAnalysisSession = useCallback(
    async (user1Handle: string, user2Handle?: string) => {
      try {
        setIsAnalyzing(true);
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        await createSession({
          sessionId,
          user1Handle,
          user2Handle,
        });

        setCurrentSession(sessionId);
        return sessionId;
      } catch (error) {
        console.error('Error starting analysis session:', error);
        setIsAnalyzing(false);
        throw error;
      }
    },
    [createSession]
  );

  const completeAnalysisSession = useCallback(
    async (
      sessionId: string,
      compatibilityResultId?: Id<'compatibilityResults'>,
      errorMessage?: string
    ) => {
      try {
        await updateSessionStatus({
          sessionId,
          status: errorMessage ? 'error' : 'completed',
          compatibilityResultId,
          errorMessage,
        });

        setIsAnalyzing(false);
        setCurrentSession(null);
      } catch (error) {
        console.error('Error completing analysis session:', error);
        throw error;
      }
    },
    [updateSessionStatus]
  );

  return {
    isAnalyzing,
    currentSession,
    analyzeUser,
    createVibeScore,
    analyzeCompatibility,
    startAnalysisSession,
    completeAnalysisSession,
  };
}
