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
  const router = useRouter();

  // Use React Query to fetch the analysis
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vibe-analysis', user1, user2],
    queryFn: () => fetchVibeAnalysis(user1, user2, 'standard'),
    retry: 1,
    retryDelay: 1000,
  });

  // Loading state
  if (isLoading) {
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
    const errorMessage =
      error instanceof VibeAPIError
        ? error.message
        : 'Something went wrong while analyzing the vibe compatibility. Please try again.';

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
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => refetch()}
              className="from-primary/10 to-primary/5 hover:from-primary/15 hover:via-primary/5 hover:to-primary/10 group relative overflow-hidden border border-white/20 bg-gradient-to-r via-transparent text-white backdrop-blur-sm transition-all duration-500 ease-out hover:border-white/30"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button
              onClick={() => router.push('/')}
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
    return <VibeResultsWrapper result={result} user1={user1} user2={user2} />;
  }

  // Shouldn't reach here, but just in case
  return null;
}
