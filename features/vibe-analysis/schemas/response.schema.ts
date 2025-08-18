import { z } from 'zod';

export const vibeAnalysisResultSchema = z.object({
  score: z
    .number()
    .min(0, 'Score must be at least 0')
    .max(100, 'Score cannot exceed 100')
    .describe('Compatibility score: 0-100 for compatibility'),

  analysis: z
    .string()
    .min(1, 'Analysis summary is required')
    .describe('2-3 sentence summary or error message'),

  strengths: z.array(z.string()).default([]).describe('Compatibility strengths'),

  challenges: z.array(z.string()).default([]).describe('Potential challenges'),

  sharedInterests: z.array(z.string()).default([]).describe('Common interests'),

  vibeType: z.string().optional().describe('Type of vibe match'),

  recommendation: z.string().optional().describe('Recommendations for interaction'),

  metadata: z.object({
    userOne: z.string().min(1, 'User one is required'),
    userTwo: z.string().min(1, 'User two is required'),
    sourcesUsed: z.number().min(0).default(0).describe('Number of X posts analyzed'),
    timestamp: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/))
      .describe('ISO 8601 timestamp'),
    modelUsed: z.string().optional().describe('AI model used for analysis'),
  }),
});

export const vibeAnalysisErrorSchema = z.object({
  error: z.string().min(1, 'Error message is required'),
  code: z.enum([
    'CONFIG_ERROR',
    'VALIDATION_ERROR',
    'RATE_LIMIT_ERROR',
    'INTERNAL_ERROR',
    'NOT_FOUND',
  ]),
  details: z.string().optional(),
});

export const grokAPIResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),

  choices: z
    .array(
      z.object({
        index: z.number(),
        message: z.object({
          role: z.string(),
          content: z.string(),
          refusal: z.string().nullable().optional(),
        }),
        finish_reason: z.string(),
      })
    )
    .min(1, 'At least one choice is required'),

  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
      num_sources_used: z.number().optional(),
      prompt_tokens_details: z
        .object({
          text_tokens: z.number(),
          audio_tokens: z.number(),
          image_tokens: z.number(),
          cached_tokens: z.number(),
        })
        .optional(),
      completion_tokens_details: z
        .object({
          reasoning_tokens: z.number(),
          audio_tokens: z.number(),
          accepted_prediction_tokens: z.number(),
          rejected_prediction_tokens: z.number(),
        })
        .optional(),
    })
    .optional(),

  system_fingerprint: z.string().optional(),
});

export type VibeAnalysisResult = z.infer<typeof vibeAnalysisResultSchema>;
export type VibeAnalysisError = z.infer<typeof vibeAnalysisErrorSchema>;
export type GrokAPIResponse = z.infer<typeof grokAPIResponseSchema>;
