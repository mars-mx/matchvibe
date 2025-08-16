import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
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
      'apiKey',
      'password',
      'token',
      'secret',
      '*.apiKey',
      '*.password',
      '*.token',
      '*.secret',
      'req.headers.authorization',
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
