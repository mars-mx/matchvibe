/**
 * Configuration constants for Grok API integration
 * Using latest Grok-4 model for advanced analysis capabilities
 */

export const GROK_CONFIG = {
  // API Settings
  baseUrl: 'https://api.x.ai/v1',

  // Model Selection
  model: process.env.GROK_MODEL_VERSION || 'grok-4-0709', // Configurable model version with fallback

  // Search Parameters
  search: {
    enabled: true,
    mode: 'normal' as const,
    dataSources: ['x'] as const, // Focus on X/Twitter data
    maxResults: 20, // Number of tweets to analyze
    includeRecent: true, // Prioritize recent content
  },

  // Generation Parameters
  generation: {
    temperature: 0.7, // Balance between creativity and consistency
    maxTokens: 2000, // Increased for complete responses
    responseFormat: { type: 'json_object' } as const, // Ensure JSON response
  },

  // Rate Limiting
  rateLimit: {
    maxRequestsPerMinute: 30,
    retryDelay: 1000, // ms
    maxRetries: 2,
  },

  // Timeouts
  timeouts: {
    request: 30000, // 30 seconds
    search: 15000, // 15 seconds for search operations
  },
};

export const VIBE_SCORE_RANGES = {
  perfect: { min: 91, max: 100, label: 'Perfect Vibe Sync' },
  good: { min: 80, max: 90, label: 'Good Vibes' },
  decent: { min: 61, max: 79, label: 'Decent Match' },
  mixed: { min: 41, max: 60, label: 'Mixed Compatibility' },
  poor: { min: 21, max: 40, label: 'Poor Match' },
  incompatible: { min: 0, max: 20, label: 'Incompatible Vibes' },
} as const;

export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'Grok API key is not configured',
  USER_NOT_FOUND: 'Could not find X user',
  SEARCH_FAILED: 'Failed to search X for user data',
  ANALYSIS_FAILED: 'Failed to analyze user vibe',
  RATE_LIMIT: 'API rate limit exceeded, please try again later',
  INVALID_USERNAME: 'Invalid X username format',
  NETWORK_ERROR: 'Network error connecting to Grok API',
} as const;
