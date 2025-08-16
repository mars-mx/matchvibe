import { z } from 'zod';
import { ConfigError } from '@/shared/lib/errors';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development')
    .describe('Node environment'),

  GROK_API_KEY: z
    .string()
    .min(1, 'GROK_API_KEY is required')
    .regex(/^xai-/, 'GROK_API_KEY must start with "xai-"')
    .describe('Grok API key for X user analysis'),

  GROK_MODEL_VERSION: z.string().default('grok-4-0709').describe('Grok model version to use'),

  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info')
    .describe('Logging level'),

  NEXT_PUBLIC_API_KEY: z.string().optional().describe('Public API key for X API integration'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Log full details securely for debugging, but don't expose in error
    console.error('Environment validation failed - full details:', result.error.format());

    throw new ConfigError(
      'Required environment variables are missing or invalid. Check server logs for details.',
      'ENV_VALIDATION',
      {
        help: 'Ensure GROK_API_KEY is set and starts with "xai-"',
        invalidFields: result.error.issues.map((issue) => issue.path.join('.')),
      }
    );
  }

  return result.data;
}

export { envSchema };
