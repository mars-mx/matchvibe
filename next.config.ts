import type { NextConfig } from 'next';
import { withBotId } from 'botid/next/config';

const nextConfig: NextConfig = {
  // Security headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // Basic CSP - adjust domains as needed for your specific services
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.app",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.x.ai https://*.convex.cloud https://*.upstash.io https://vercel.live wss://*.convex.cloud https://*.vercel.app",
              "media-src 'self'",
              "object-src 'none'",
              "child-src 'self'",
              "frame-src 'self' https://vercel.live",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "manifest-src 'self'",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
      // Only add HSTS header in production
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/(.*)',
              headers: [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains',
                },
              ],
            },
          ]
        : []),
    ];
  },
};

// Wrap the config with BotId to enable bot protection
export default withBotId(nextConfig);
