/**
 * Vibe Analysis specific constants
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
 * Form validation limits for usernames
 */
export const USERNAME_LIMITS = {
  MIN: 1,
  MAX: 50,
} as const;

/**
 * Share functionality constants
 */
export const SHARE_CONFIG = {
  BASE_URL: 'https://matchvibe.app',
  SHARE_TEXT_TEMPLATE: 'Vibe Check: @{user1} × @{user2} = {score}/100 ({level}) 🎯',
} as const;

export type AnalysisDepth = (typeof ANALYSIS_DEPTHS)[keyof typeof ANALYSIS_DEPTHS];
export type CompatibilityLevel = keyof typeof COMPATIBILITY_LEVELS;
