/**
 * Application-wide configuration constants
 * Centralizes magic numbers and thresholds
 */

/**
 * Vibe score thresholds for compatibility levels
 */
export const VIBE_THRESHOLDS = {
  PERFECT: 90,
  HIGH: 70,
  MEDIUM: 50,
} as const;

/**
 * Analysis depth options
 */
export const ANALYSIS_DEPTHS = {
  QUICK: 'quick',
  STANDARD: 'standard',
  DEEP: 'deep',
} as const;

/**
 * Compatibility level labels and colors
 */
export const COMPATIBILITY_LEVELS = {
  perfect: {
    label: 'Perfect Match',
    color: 'text-green-500',
    minScore: VIBE_THRESHOLDS.PERFECT,
  },
  high: {
    label: 'High Compatibility',
    color: 'text-blue-500',
    minScore: VIBE_THRESHOLDS.HIGH,
  },
  medium: {
    label: 'Moderate Compatibility',
    color: 'text-yellow-500',
    minScore: VIBE_THRESHOLDS.MEDIUM,
  },
  low: {
    label: 'Low Compatibility',
    color: 'text-red-500',
    minScore: 0,
  },
} as const;

/**
 * Time formatting thresholds
 */
export const TIME_THRESHOLDS = {
  MINUTE: 60000, // 60 seconds in milliseconds
  HOUR: 3600000, // 60 minutes in milliseconds
  DAY: 86400000, // 24 hours in milliseconds
} as const;

/**
 * Form validation limits
 */
export const FORM_LIMITS = {
  USERNAME_MIN: 1,
  USERNAME_MAX: 50,
} as const;

/**
 * API response limits
 */
export const API_LIMITS = {
  MAX_RESPONSE_SIZE: 1048576, // 1MB
  TIMEOUT_MS: 30000, // 30 seconds
} as const;

/**
 * Share functionality constants
 */
export const SHARE_CONFIG = {
  BASE_URL: 'https://matchvibe.app',
  SHARE_TEXT_TEMPLATE:
    'Vibe Check: @{user1} × @{user2} = {score}/100 ({level}) 🎯\n\nCheck your vibe compatibility at matchvibe.app',
} as const;

export type AnalysisDepth = (typeof ANALYSIS_DEPTHS)[keyof typeof ANALYSIS_DEPTHS];
export type CompatibilityLevel = keyof typeof COMPATIBILITY_LEVELS;
