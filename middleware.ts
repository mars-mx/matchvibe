import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configuration
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';

// Initialize rate limiter only if enabled and Redis is configured
const ratelimit =
  RATE_LIMIT_ENABLED && process.env.UPSTASH_REDIS_REST_URL
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        }),
        limiter: Ratelimit.slidingWindow(20, '10 m'),
        analytics: true,
        prefix: 'vibe-analysis',
      })
    : null;

export async function middleware(request: NextRequest) {
  // Only apply to vibe analysis routes
  if (!request.nextUrl.pathname.startsWith('/vibe/')) {
    return NextResponse.next();
  }

  // Skip middleware for static assets and API routes
  if (request.nextUrl.pathname.includes('_next') || request.nextUrl.pathname.includes('api')) {
    return NextResponse.next();
  }

  try {
    // Rate Limiting Check
    if (ratelimit) {
      const identifier = getClientIdentifier(request);
      const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

      if (!success) {
        return new NextResponse(
          'Too many vibe analysis requests. Please wait before analyzing more users.',
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': new Date(reset).toISOString(),
              'Retry-After': Math.floor((reset - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      // Add rate limit headers to successful responses
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // Log error but don't block the request
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

// Helper function to get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  // Try to get the real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const vercelIp = request.headers.get('x-vercel-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (vercelIp) {
    return vercelIp;
  }

  // Fallback to a generic identifier
  return 'anonymous';
}

export const config = {
  matcher: [
    // Match all /vibe routes except static files
    '/vibe/:path*',
  ],
};
