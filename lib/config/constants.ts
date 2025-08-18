/**
 * Application-wide generic configuration constants
 * For vibe-specific constants, see features/vibe-analysis/config/vibe-constants.ts
 */

/**
 * Time formatting thresholds
 */
export const TIME_THRESHOLDS = {
  MINUTE: 60000, // 60 seconds in milliseconds
  HOUR: 3600000, // 60 minutes in milliseconds
  DAY: 86400000, // 24 hours in milliseconds
} as const;

/**
 * API response limits
 */
export const API_LIMITS = {
  MAX_RESPONSE_SIZE: 1048576, // 1MB
  TIMEOUT_MS: 30000, // 30 seconds
} as const;

/**
 * General form validation limits
 */
export const FORM_LIMITS = {
  TEXT_MIN: 1,
  TEXT_MAX: 500,
  TEXTAREA_MAX: 5000,
} as const;
