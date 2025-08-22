'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface VibeErrorBoundaryProps {
  children: React.ReactNode;
  userOne?: string;
  userTwo?: string;
}

/**
 * Specialized Error Boundary for Vibe Analysis
 *
 * Provides custom error handling and recovery options specific to vibe analysis failures.
 * Includes options to retry analysis or try with different usernames.
 */
export function VibeErrorBoundary({ children, userOne, userTwo }: VibeErrorBoundaryProps) {
  const handleError = (error: Error) => {
    // Log to analytics/monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service
      console.error('Vibe analysis error:', {
        error: error.message,
        userOne,
        userTwo,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const fallback = (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 p-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
          <div className="space-y-6 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>

            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">Vibe Analysis Failed</h1>
              <p className="text-lg text-white/80">
                We couldn&apos;t complete the vibe analysis. This might be temporary.
              </p>
            </div>

            {userOne && userTwo && (
              <Alert className="border-white/20 bg-white/10 text-white">
                <AlertTitle>Analysis Request</AlertTitle>
                <AlertDescription className="text-white/80">
                  Failed to analyze compatibility between @{userOne} and @{userTwo}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-white text-purple-600 hover:bg-white/90"
                size="lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              <Link href="/" className="block">
                <Button
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/10"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>

            <div className="border-t border-white/20 pt-4">
              <p className="text-sm text-white/60">
                Common issues: Invalid usernames, API timeouts, or rate limits. Try again in a few
                moments or check the usernames.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}
