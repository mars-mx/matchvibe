'use server';

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';

// Initialize server-side Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Creates a new matchup record when analysis starts
 */
export async function createMatchupAction(
  sessionId: string,
  userOne: string,
  userTwo?: string
): Promise<Id<'matchups'>> {
  try {
    const matchupId = await convex.mutation(api.matchups.createMatchup, {
      sessionId,
      user_one_username: userOne,
      user_two_username: userTwo,
    });

    return matchupId;
  } catch (error) {
    console.error('Failed to create matchup:', error);
    throw new Error('Failed to create matchup record');
  }
}

/**
 * Updates matchup status (analyzing -> completed/error)
 */
export async function updateMatchupStatusAction(
  sessionId: string,
  status: 'analyzing' | 'completed' | 'error',
  resultId?: Id<'results'>,
  errorMessage?: string
): Promise<Id<'matchups'>> {
  try {
    const matchupId = await convex.mutation(api.matchups.updateMatchupStatus, {
      sessionId,
      status,
      resultId,
      errorMessage,
    });

    return matchupId;
  } catch (error) {
    console.error('Failed to update matchup status:', error);
    throw new Error('Failed to update matchup status');
  }
}

/**
 * Saves vibe analysis results to the database
 */
export async function saveVibeResultAction(
  result: VibeAnalysisResult,
  userOne: string,
  userTwo: string
): Promise<Id<'results'>> {
  try {
    const resultId = await convex.mutation(api.results.createResult, {
      user_one_username: userOne,
      user_two_username: userTwo,
      compatibilityScore: result.score,
      sharedInterests: result.sharedInterests,
      complementaryTraits: result.strengths,
      potentialConflicts: result.challenges,
      overallAssessment: result.analysis,
    });

    return resultId;
  } catch (error) {
    console.error('Failed to save vibe result:', error);
    throw new Error('Failed to save analysis results');
  }
}

// Type for Convex result document
interface ConvexResult {
  _id: Id<'results'>;
  user_one_username: string;
  user_two_username: string;
  compatibilityScore: number;
  sharedInterests: string[];
  complementaryTraits: string[];
  potentialConflicts: string[];
  overallAssessment: string;
  createdAt: string;
}

// Type for Convex matchup document
interface ConvexMatchup {
  _id: Id<'matchups'>;
  sessionId: string;
  user_one_username: string;
  user_two_username?: string;
  status: 'analyzing' | 'completed' | 'error';
  resultId?: Id<'results'>;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Checks if a result already exists for the given user pair
 */
export async function getExistingResultAction(
  userOne: string,
  userTwo: string
): Promise<ConvexResult | null> {
  try {
    const existingResult = await convex.query(api.results.getResult, {
      user_one_username: userOne,
      user_two_username: userTwo,
    });

    return existingResult;
  } catch (error) {
    console.error('Failed to check existing result:', error);
    return null;
  }
}

/**
 * Gets matchup status by session ID
 */
export async function getMatchupAction(sessionId: string): Promise<ConvexMatchup | null> {
  try {
    const matchup = await convex.query(api.matchups.getMatchup, {
      sessionId,
    });

    return matchup;
  } catch (error) {
    console.error('Failed to get matchup:', error);
    return null;
  }
}
