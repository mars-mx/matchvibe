import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, formatRateLimitHeaders } from '@/lib/security/rate-limit';

/**
 * Edge Middleware for MatchVibe
 *
 * Applies rate limiting to protect critical routes from abuse:
 * - /vibe/* - User vibe analysis pages
 * - /api/vibe/* - API endpoints for vibe analysis
 *
 * Features:
 * - Sliding window rate limiting with Upstash Redis
 * - Graceful degradation when Redis is unavailable
 * - Development-friendly (disabled by default in dev)
 * - Comprehensive rate limit headers on all responses
 */
export async function middleware(request: NextRequest) {
  try {
    // Check rate limit using existing utility
    const result = await checkRateLimit(request);

    if (!result.success) {
      // Rate limit exceeded - return 429 with proper headers
      const headers = formatRateLimitHeaders(result);

      // For API routes, return JSON error
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: result.reset
              ? Math.ceil((new Date(result.reset).getTime() - Date.now()) / 1000)
              : 60,
          },
          {
            status: 429,
            headers,
          }
        );
      }

      // For page routes, return HTML error page
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Rate Limit Exceeded - MatchVibe</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                max-width: 500px;
                margin: 1rem;
              }
              h1 {
                font-size: 3rem;
                margin: 0 0 1rem;
              }
              p {
                font-size: 1.2rem;
                margin: 1rem 0;
                opacity: 0.9;
              }
              .retry-time {
                font-size: 2rem;
                font-weight: bold;
                margin: 2rem 0;
              }
              a {
                color: white;
                text-decoration: underline;
                opacity: 0.8;
                transition: opacity 0.2s;
              }
              a:hover {
                opacity: 1;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>429</h1>
              <h2>Too Many Requests</h2>
              <p>You've made too many requests in a short period.</p>
              <p class="retry-time">Please try again in ${result.reset ? Math.ceil((new Date(result.reset).getTime() - Date.now()) / 1000) : 60} seconds</p>
              <p><a href="/">Return to Home</a></p>
            </div>
          </body>
        </html>
        `,
        {
          status: 429,
          headers: {
            'Content-Type': 'text/html',
            ...Object.fromEntries(headers),
          },
        }
      );
    }

    // Rate limit check passed - add headers to response
    const response = NextResponse.next();
    const headers = formatRateLimitHeaders(result);
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    // Log error but don't block the request
    // This ensures the app remains functional even if rate limiting fails
    console.error('Middleware rate limiting error:', error);

    // Continue without rate limiting in case of errors
    // This follows the principle of graceful degradation
    return NextResponse.next();
  }
}

/**
 * Middleware configuration
 * Specifies which routes this middleware should run on
 */
export const config = {
  matcher: [
    // Protect vibe analysis pages
    '/vibe/:path*',

    // Protect vibe API endpoints
    '/api/vibe/:path*',

    // Note: We don't apply middleware to static assets, _next, or root pages
    // to avoid unnecessary processing and maintain performance
  ],
};
