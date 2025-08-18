import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Disable pino-pretty in Next.js environment to avoid worker thread issues
const isNextJs = typeof window === 'undefined' && !process.env.JEST_WORKER_ID;
const shouldUsePretty = isDevelopment && !isNextJs;

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // Disable transport in Next.js to avoid worker thread issues
  transport: shouldUsePretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
  enabled: !isTest,
  base: {
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: [
      // Direct sensitive fields
      'apiKey',
      'password',
      'token',
      'secret',
      'auth',
      'authorization',
      'key',
      'credentials',
      // Nested sensitive fields
      '*.apiKey',
      '*.password',
      '*.token',
      '*.secret',
      '*.auth',
      '*.authorization',
      '*.key',
      '*.credentials',
      // HTTP headers
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      // Request/response bodies that might contain PII
      'req.body.password',
      'req.body.token',
      'req.body.secret',
      // Nested object patterns
      '*.body.password',
      '*.body.token',
      '*.body.secret',
      // Environment variables
      'env.GROK_API_KEY',
      'env.*.KEY',
      'env.*.SECRET',
      'env.*.TOKEN',
      // User data that might be PII
      'email',
      'phone',
      'ssn',
      '*.email',
      '*.phone',
      '*.ssn',
      // Error stack traces in production
      ...(process.env.NODE_ENV === 'production' ? ['stack', '*.stack', 'error.stack'] : []),
    ],
    remove: true,
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
});

export function createChildLogger(context: string, metadata?: Record<string, unknown>) {
  return logger.child({ context, ...metadata });
}

export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  service?: string;
  [key: string]: unknown;
}

export function logWithContext(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context?: LogContext
) {
  const method = logger[level].bind(logger);
  method(context || {}, message);
}

export { logger };
