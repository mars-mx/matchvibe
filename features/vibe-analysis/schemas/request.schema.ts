import { z } from 'zod';

/**
 * Enhanced username validation with security checks
 * Prevents injection attacks and ensures valid X/Twitter username format
 */
const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .max(15, 'Username must be 15 characters or less')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .refine((username) => {
    // Additional security checks
    const sanitized = username.trim().toLowerCase();

    // Block potential injection patterns
    const dangerousPatterns = [
      'javascript:',
      'data:',
      'vbscript:',
      '<script',
      '</script',
      'eval(',
      'function(',
      'alert(',
      'prompt(',
      'confirm(',
    ];

    return !dangerousPatterns.some((pattern) => sanitized.includes(pattern));
  }, 'Username contains invalid characters or patterns')
  .refine((username) => {
    // Ensure username doesn't start with special characters that could cause issues
    return /^[a-zA-Z0-9]/.test(username);
  }, 'Username must start with a letter or number')
  .transform((username) => {
    // Sanitize: trim whitespace and normalize case for consistent processing
    return username.trim();
  });

export const vibeAnalysisRequestSchema = z.object({
  userOne: usernameSchema,
  userTwo: usernameSchema,
  analysisDepth: z.enum(['quick', 'standard', 'deep']).default('standard').optional(),
});
