import { z } from 'zod';

const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .max(15, 'Username must be 15 characters or less')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const vibeAnalysisRequestSchema = z.object({
  userOne: usernameSchema,
  userTwo: usernameSchema,
  analysisDepth: z.enum(['quick', 'standard', 'deep']).default('standard').optional(),
});
