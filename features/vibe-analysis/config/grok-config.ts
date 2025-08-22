/**
 * Grok API Configuration
 * Using latest Grok-4 model for advanced analysis capabilities
 */

export const GROK_CONFIG = {
  // API Settings
  baseUrl: 'https://api.x.ai/v1',

  // Model Selection
  model: process.env.GROK_MODEL_VERSION || 'grok-3-mini', // Using grok-3-mini as default for cost efficiency

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

  // Rate Limiting (Legacy - kept for backward compatibility)
  // New rate limiting is handled by GrokRateLimiter and GrokRetryManager
  rateLimit: {
    maxRequestsPerMinute: 30,
    retryDelay: 1000, // ms
    maxRetries: 2,
  },

  // Timeouts - optimized for Vercel Hobby plan (60 second function limit)
  timeouts: {
    request: 45000, // 45 seconds to leave buffer for response
    searchEnabled: 50000, // 50 seconds when search is enabled
    search: 20000, // 20 seconds for search operations alone
    connection: 5000, // 5 seconds for connection establishment
  },
};

// Vibe-specific constants moved to vibe-constants.ts for better organization

/**
 * Grok-specific error messages
 */
export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'Grok API key is not configured',
  USER_NOT_FOUND: 'Could not find X user',
  SEARCH_FAILED: 'Failed to search X for user data',
  ANALYSIS_FAILED: 'Failed to analyze user vibe',
  RATE_LIMIT: 'API rate limit exceeded, please try again later',
  INVALID_USERNAME: 'Invalid X username format',
  NETWORK_ERROR: 'Network error connecting to Grok API',
} as const;

// Grok API Pricing (per million tokens)
export const GROK_PRICING = {
  'grok-4-0709': {
    input: 3.0, // $3.00 per 1M input tokens
    output: 15.0, // $15.00 per 1M output tokens
  },
  'grok-3': {
    input: 3.0, // $3.00 per 1M input tokens
    output: 15.0, // $15.00 per 1M output tokens
  },
  'grok-3-mini': {
    input: 0.3, // $0.30 per 1M input tokens
    output: 0.5, // $0.50 per 1M output tokens
  },
} as const;

// Grok Live Search Pricing
export const LIVE_SEARCH_PRICING = {
  costPerSource: 0.025, // $0.025 per source used
  costPer1000Sources: 25.0, // $25 per 1,000 sources
} as const;

// Grok API Rate Limits (Official from xAI documentation)
export const GROK_RATE_LIMITS = {
  'grok-4-0709': {
    contextWindow: 256000,
    tokensPerMinute: 2000000,
    requestsPerMinute: 480,
  },
  'grok-4': {
    contextWindow: 256000,
    tokensPerMinute: 2000000,
    requestsPerMinute: 480,
  },
  'grok-3': {
    contextWindow: 131072,
    requestsPerMinute: 600, // Higher RPM than grok-4
  },
  'grok-3-mini': {
    contextWindow: 131072,
    requestsPerMinute: 480,
  },
} as const;
