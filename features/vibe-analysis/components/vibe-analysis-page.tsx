'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchVibeAnalysis, VibeAPIError } from '@/features/vibe-analysis/lib/vibe-api-client';
import { VibeResultsWrapper } from '@/features/vibe-analysis/components/vibe-results-wrapper';
import { VibeSkeleton } from '@/features/vibe-analysis/components/vibe-skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VibeAnalysisPageProps {
  user1: string;
  user2: string;
}

export function VibeAnalysisPage({ user1, user2 }: VibeAnalysisPageProps) {
  console.log('[VibeAnalysisPage] Component rendered/re-rendered', {
    user1,
    user2,
    timestamp: new Date().toISOString(),
    propsValid: !!(user1 && user2),
    user1Length: user1?.length || 0,
    user2Length: user2?.length || 0,
  });

  const router = useRouter();

  // Use React Query to fetch the analysis
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vibe-analysis', user1, user2],
    queryFn: () => {
      console.log('[VibeAnalysisPage] React Query executing fetchVibeAnalysis', {
        user1,
        user2,
        analysisDepth: 'standard',
        queryKey: ['vibe-analysis', user1, user2],
      });
      return fetchVibeAnalysis(user1, user2, 'standard');
    },
    retry: 1,
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
      console.log('[VibeAnalysisPage] React Query retry delay calculated', {
        attemptIndex,
        calculatedDelay: delay,
        maxDelay: 30000,
      });
      return delay;
    },
  });

  console.log('[VibeAnalysisPage] React Query state', {
    isLoading,
    hasError: !!error,
    hasResult: !!result,
    errorType: error?.constructor?.name,
    errorMessage: error instanceof Error ? error.message : undefined,
    resultKeys: result ? Object.keys(result) : undefined,
    queryKey: ['vibe-analysis', user1, user2],
  });

  // Loading state
  if (isLoading) {
    console.log('[VibeAnalysisPage] Rendering loading state', {
      user1,
      user2,
      isLoading: true,
      renderTime: new Date().toISOString(),
    });

    return (
      <section className="relative flex h-screen flex-col overflow-hidden md:overflow-hidden">
        <div className="gradient-bg absolute inset-0" />

        <div className="relative z-10 flex h-full flex-col overflow-y-auto px-4 py-4 sm:px-6 md:overflow-y-auto md:py-6">
          {/* Header - Compact */}
          <div className="mb-4 flex-shrink-0 text-center md:mb-6">
            <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm md:mb-3 md:px-4 md:py-2 md:text-sm">
              <span className="bg-primary mr-2 h-1.5 w-1.5 animate-pulse rounded-full md:h-2 md:w-2"></span>
              Analyzing Vibe Compatibility...
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              <span className="gradient-text">Computing Vibe Match</span>
            </h1>
          </div>

          {/* Skeleton Components */}
          <VibeSkeleton />
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    console.error('[VibeAnalysisPage] Rendering error state', {
      user1,
      user2,
      error: {
        type: error.constructor.name,
        message: error instanceof Error ? error.message : String(error),
        status: error instanceof VibeAPIError ? error.status : undefined,
        details: error instanceof VibeAPIError ? error.details : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      },
      isVibeAPIError: error instanceof VibeAPIError,
      renderTime: new Date().toISOString(),
    });

    let errorMessage =
      'Something went wrong while analyzing the vibe compatibility. Please try again.';
    let errorHint = '';

    if (error instanceof VibeAPIError) {
      errorMessage = error.message;

      console.log('[VibeAnalysisPage] Processing VibeAPIError', {
        status: error.status,
        message: error.message,
        details: error.details,
      });

      // Provide user-friendly hints based on error type
      if (error.status === 408 || error.message.includes('timed out')) {
        errorHint =
          'The analysis took too long to complete. Try using shorter usernames or try again later when the service is less busy.';
        console.log('[VibeAnalysisPage] Timeout error detected', {
          status: error.status,
          hint: errorHint,
        });
      } else if (error.status === 0 || error.message.includes('Network error')) {
        errorHint =
          'This might be a connection issue. Please check your internet connection and try again.';
        console.log('[VibeAnalysisPage] Network error detected', {
          status: error.status,
          hint: errorHint,
        });
      } else if (error.status === 429) {
        errorHint = 'Too many requests. Please wait a moment before trying again.';
        console.log('[VibeAnalysisPage] Rate limit error detected', {
          status: error.status,
          hint: errorHint,
        });
      } else if (error.status >= 500) {
        errorHint = 'Our servers are experiencing issues. Please try again later.';
        console.log('[VibeAnalysisPage] Server error detected', {
          status: error.status,
          hint: errorHint,
        });
      } else if (error.status === 404) {
        errorHint = 'One or both usernames might not exist on X/Twitter.';
        console.log('[VibeAnalysisPage] Not found error detected', {
          status: error.status,
          hint: errorHint,
        });
      }
    } else {
      console.log('[VibeAnalysisPage] Non-VibeAPIError detected', {
        errorType: error.constructor.name,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }

    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
        <div className="gradient-bg absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-md text-center">
          {/* Error Icon */}
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>

          {/* Error Title */}
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-white">
            Vibe Analysis Failed
          </h1>

          {/* Error Message */}
          <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-sm text-white/70">{errorMessage}</p>
            {errorHint && <p className="mt-2 text-xs text-white/50">{errorHint}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => {
                console.log('[VibeAnalysisPage] Try Again button clicked', {
                  user1,
                  user2,
                  timestamp: new Date().toISOString(),
                  action: 'refetch',
                });
                refetch();
              }}
              className="from-primary/10 to-primary/5 hover:from-primary/15 hover:via-primary/5 hover:to-primary/10 group relative overflow-hidden border border-white/20 bg-gradient-to-r via-transparent text-white backdrop-blur-sm transition-all duration-500 ease-out hover:border-white/30"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button
              onClick={() => {
                console.log('[VibeAnalysisPage] Go Home button clicked', {
                  user1,
                  user2,
                  timestamp: new Date().toISOString(),
                  action: 'navigate_home',
                });
                router.push('/');
              }}
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Help Text */}
          <p className="mt-8 text-xs text-white/50">
            If this problem persists, please check your internet connection or try again later.
          </p>
        </div>
      </section>
    );
  }

  // Success state - show results
  if (result) {
    console.log('[VibeAnalysisPage] Rendering success state with results', {
      user1,
      user2,
      resultKeys: Object.keys(result),
      hasCompatibilityScore: 'compatibilityScore' in result,
      resultType: typeof result,
      renderTime: new Date().toISOString(),
    });

    return <VibeResultsWrapper result={result} user1={user1} user2={user2} />;
  }

  // Shouldn't reach here, but just in case
  console.warn('[VibeAnalysisPage] Reached unexpected fallback state', {
    user1,
    user2,
    isLoading,
    hasError: !!error,
    hasResult: !!result,
    timestamp: new Date().toISOString(),
    queryState: {
      isLoading,
      error: error
        ? {
            type: (error as any).constructor?.name,
            message: (error as any) instanceof Error ? (error as Error).message : String(error),
          }
        : null,
      result: result ? 'present' : 'null',
    },
  });

  return null;
}
