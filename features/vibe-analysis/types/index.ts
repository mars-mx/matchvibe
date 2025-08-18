/**
 * Type definitions for vibe compatibility analysis
 * Focused on comparing two X users
 */

// Request type - requires two users
export interface VibeAnalysisRequest {
  userOne: string;
  userTwo: string;
  analysisDepth?: 'quick' | 'standard' | 'deep';
}

// User Profile type - fetched from X via Grok
export interface UserProfile {
  username: string;
  displayName: string | null;

  recentTweets: Array<{
    text: string;
    isReply?: boolean;
    hasMedia?: boolean;
  }> | null;

  contentStyle: {
    primaryContentType: 'shitposts' | 'serious' | 'mixed' | 'news' | 'personal' | null;
    humorStyle: 'sarcastic' | 'wholesome' | 'edgy' | 'dry' | 'none' | null;
    tone: 'positive' | 'negative' | 'neutral' | 'mixed' | null;
    usesEmojis: boolean | null;
    formality: 'very_formal' | 'formal' | 'casual' | 'very_casual' | null;
    shitpostRating: number | null;
    memeRating: number | null;
    qualityRating: number | null;
  };

  topTopics: string[] | null;
  notableTraits: string[] | null;

  searchConfidence: number;
  dataCompleteness: number;

  // Optional citations from Grok search
  citations?: Array<{
    id?: number;
    source?: string;
    url?: string;
    text?: string;
  }> | null;
}

// Profile fetch error type
export interface UserProfileError {
  error: string;
  username: string;
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
  metadata: {
    userOne: string;
    userTwo: string;
    sourcesUsed: number; // Number of X posts analyzed
    timestamp: string;
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
