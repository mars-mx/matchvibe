import { randomUUID } from 'crypto';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';

/**
 * Generates a unique session ID for tracking matchups
 */
export function generateSessionId(): string {
  return randomUUID();
}

/**
 * Creates a standardized matchup key for caching and deduplication
 */
export function createMatchupKey(userOne: string, userTwo: string): string {
  // Sort usernames to ensure consistent key regardless of order
  const sorted = [userOne.toLowerCase(), userTwo.toLowerCase()].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

/**
 * Converts VibeAnalysisResult to Convex results schema format
 */
export function mapVibeResultToConvexSchema(
  result: VibeAnalysisResult,
  userOne: string,
  userTwo: string
) {
  return {
    user_one_username: userOne,
    user_two_username: userTwo,
    compatibilityScore: Math.max(0, Math.min(100, result.score)), // Ensure score is 0-100
    sharedInterests: result.sharedInterests || [],
    complementaryTraits: result.strengths || [],
    potentialConflicts: result.challenges || [],
    overallAssessment: result.analysis || 'No analysis available',
  };
}

// Type for Convex result document
interface ConvexResultDocument {
  _id: string;
  user_one_username: string;
  user_two_username: string;
  compatibilityScore: number;
  sharedInterests: string[];
  complementaryTraits: string[];
  potentialConflicts: string[];
  overallAssessment: string;
  createdAt: string;
}

/**
 * Converts Convex results schema back to VibeAnalysisResult format
 */
export function mapConvexSchemaToVibeResult(
  convexResult: ConvexResultDocument
): VibeAnalysisResult {
  return {
    score: convexResult.compatibilityScore,
    analysis: convexResult.overallAssessment,
    strengths: convexResult.complementaryTraits,
    challenges: convexResult.potentialConflicts,
    sharedInterests: convexResult.sharedInterests,
    metadata: {
      userOne: convexResult.user_one_username,
      userTwo: convexResult.user_two_username,
      sourcesUsed: 0, // Not stored in Convex schema
      timestamp: convexResult.createdAt,
    },
  };
}

/**
 * Validates that usernames are different and properly formatted
 */
export function validateMatchupUsers(userOne: string, userTwo: string): void {
  const cleanUserOne = userOne.replace('@', '').trim();
  const cleanUserTwo = userTwo.replace('@', '').trim();

  if (!cleanUserOne || !cleanUserTwo) {
    throw new Error('Both usernames are required');
  }

  if (cleanUserOne.toLowerCase() === cleanUserTwo.toLowerCase()) {
    throw new Error('Please enter two different usernames');
  }
}
