'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';

// Initialize Convex client
let convex: ConvexReactClient | null = null;

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (convexUrl) {
  try {
    convex = new ConvexReactClient(convexUrl);

    // Warn if using localhost URL and we're likely in production (based on window.location)
    if (
      typeof window !== 'undefined' &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1') &&
      (convexUrl.includes('127.0.0.1') || convexUrl.includes('localhost'))
    ) {
      console.warn(
        '[ConvexClientProvider] Warning: Using localhost Convex URL in production. ' +
          'Set NEXT_PUBLIC_CONVEX_URL in Vercel environment variables to enable caching.'
      );
    }
  } catch (error) {
    console.error('[ConvexClientProvider] Failed to initialize Convex:', error);
  }
} else {
  console.warn('[ConvexClientProvider] NEXT_PUBLIC_CONVEX_URL not set. Convex features disabled.');
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // If no valid Convex client, just render children without provider
  if (!convex) {
    return <>{children}</>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
