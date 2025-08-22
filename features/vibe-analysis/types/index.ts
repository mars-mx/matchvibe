/**
 * Type definitions for vibe compatibility analysis
 * Focused on comparing two X users
 */

// Import types from Zod schemas (single source of truth)
import type { UserProfile } from '../schemas/profile.schema';
export type { UserProfile, UserProfileError, MatchingResult } from '../schemas/profile.schema';

// Request type - requires two users
export interface VibeAnalysisRequest {
  userOne: string;
  userTwo: string;
  analysisDepth?: 'quick' | 'standard' | 'deep';
}

// Result type - compatibility analysis only
export interface VibeAnalysisResult {
  score: number; // -1 for error, 0-100 for compatibility score
  analysis: string; // 2-3 sentence summary or error message
  strengths: string[]; // Compatibility strengths
  challenges: string[]; // Potential challenges
  sharedInterests: string[]; // Common interests
  vibeType?: 'perfect_match' | 'complementary' | 'growth' | 'challenging' | 'incompatible'; // Optional vibe category
  recommendation?: string; // Optional interaction advice
  profiles?: {
    user1: UserProfile;
    user2: UserProfile;
  };
  metadata: {
    userOne: string;
    userTwo: string;
    sourcesUsed: number; // Number of X posts analyzed
    timestamp: string;
    modelUsed?: string; // AI model used for analysis
    dimensionBreakdown?: any; // Detailed dimension analysis
    categoryScores?: Record<string, number>; // Category scores
    topMatches?: string[]; // Top matching dimensions
    topClashes?: string[]; // Top clashing dimensions
  };
}

// API Response type (same as result for now)
export type VibeAnalysisResponse = VibeAnalysisResult;

// Error response type
export interface VibeAnalysisError {
  error: string;
  code: 'CONFIG_ERROR' | 'VALIDATION_ERROR' | 'RATE_LIMIT_ERROR' | 'INTERNAL_ERROR' | 'NOT_FOUND';
  details?: string;
}

// Grok API response type
export interface GrokAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      refusal?: string | null;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    num_sources_used?: number; // X search sources used
    prompt_tokens_details?: {
      text_tokens: number;
      audio_tokens: number;
      image_tokens: number;
      cached_tokens: number;
    };
    completion_tokens_details?: {
      reasoning_tokens: number;
      audio_tokens: number;
      accepted_prediction_tokens: number;
      rejected_prediction_tokens: number;
    };
  };
  system_fingerprint?: string;
}
