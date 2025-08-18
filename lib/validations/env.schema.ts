import { z } from 'zod';
import { ConfigError } from '@/shared/lib/errors';

const envSchema = z
  .object({
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

    GROK_MAX_TOKENS: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().positive().int())
      .default(10000)
      .describe('Maximum tokens for Grok API responses'),

    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
      .default('info')
      .describe('Logging level'),

    NEXT_PUBLIC_API_KEY: z.string().optional().describe('Public API key for X API integration'),

    // Upstash Redis Configuration
    UPSTASH_REDIS_REST_URL: z
      .string()
      .url('UPSTASH_REDIS_REST_URL must be a valid URL')
      .startsWith('https://', 'UPSTASH_REDIS_REST_URL must use HTTPS')
      .optional()
      .describe('Upstash Redis REST API URL'),

    UPSTASH_REDIS_REST_TOKEN: z
      .string()
      .min(1, 'UPSTASH_REDIS_REST_TOKEN is required when URL is set')
      .optional()
      .describe('Upstash Redis REST API token'),

    // Rate Limiting Configuration
    RATE_LIMIT_ENABLED: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .default(process.env.NODE_ENV === 'production')
      .describe('Enable rate limiting (default: true in production)'),

    RATE_LIMIT_MAX_REQUESTS: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().positive().int())
      .default(20)
      .describe('Maximum requests allowed in the window'),

    RATE_LIMIT_WINDOW_MINUTES: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().positive().int())
      .default(10)
      .describe('Rate limit window duration in minutes'),

    RATE_LIMIT_REFILL_RATE: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().positive().int())
      .default(2)
      .describe('Tokens refilled per minute'),

    RATE_LIMIT_BURST_CAPACITY: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().positive().int())
      .default(5)
      .describe('Extra burst capacity allowed'),
  })
  .refine(
    (data) => {
      // If Redis URL is provided, token must also be provided
      if (data.UPSTASH_REDIS_REST_URL && !data.UPSTASH_REDIS_REST_TOKEN) {
        return false;
      }
      return true;
    },
    {
      message: 'UPSTASH_REDIS_REST_TOKEN is required when UPSTASH_REDIS_REST_URL is provided',
      path: ['UPSTASH_REDIS_REST_TOKEN'],
    }
  )
  .refine(
    (data) => {
      // If rate limiting is enabled in production, Redis config must be provided
      if (data.RATE_LIMIT_ENABLED && data.NODE_ENV === 'production') {
        return !!(data.UPSTASH_REDIS_REST_URL && data.UPSTASH_REDIS_REST_TOKEN);
      }
      return true;
    },
    {
      message: 'Redis configuration is required for rate limiting in production',
      path: ['UPSTASH_REDIS_REST_URL'],
    }
  );

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
