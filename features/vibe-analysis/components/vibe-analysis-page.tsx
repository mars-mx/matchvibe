'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchVibeAnalysis, VibeAPIError } from '@/features/vibe-analysis/lib/vibe-api-client';
import { VibeResultsWrapper } from '@/features/vibe-analysis/components/vibe-results-wrapper';
import { CircularProgressFullscreen } from '@/components/ui/circular-progress-fullscreen';
import { useSimulatedProgress } from '@/features/vibe-analysis/hooks/use-simulated-progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface VibeAnalysisPageProps {
  user1: string;
  user2: string;
}

export function VibeAnalysisPage({ user1, user2 }: VibeAnalysisPageProps) {
  const router = useRouter();

  // Initialize simulated progress
  const { progress, start, complete, reset, isComplete } = useSimulatedProgress({
    expectedDuration: 45000, // 45 seconds expected
    updateInterval: 100, // Smooth updates
    minDuration: 3000, // Show for at least 3 seconds
  });

  // Use React Query to fetch the analysis
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vibe-analysis', user1, user2],
    queryFn: () => fetchVibeAnalysis(user1, user2, 'standard'),
    enabled: !!user1 && !!user2,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Start progress when loading starts
  useEffect(() => {
    if (isLoading) {
      start();
    }
  }, [isLoading, start]);

  // Complete progress when data arrives
  useEffect(() => {
    if (result || error) {
      complete();
    }
  }, [result, error, complete]);

  // Reset progress when refetching
  useEffect(() => {
    const handleRefetch = () => {
      reset();
      start();
    };

    if (isLoading) {
      handleRefetch();
    }
  }, [isLoading, reset, start]);

  // Show toast for credit exhaustion errors
  useEffect(() => {
    if (error instanceof VibeAPIError) {
      if (error.status === 402 || 
          error.message.toLowerCase().includes('credit') ||
          error.message.toLowerCase().includes('quota') ||
          error.message.toLowerCase().includes('marsc_hb') ||
          error.message.toLowerCase().includes('richkuo7')) {
        toast.error('Please let marsc_hb or richkuo7 know that the app is out of credits and we will top up', {
          duration: 10000, // 10 seconds for visibility
          action: {
            label: 'Dismiss',
            onClick: () => {},
          },
        });
      }
    }
  }, [error]);

  // Loading state with new circular progress
  // Show loading until both the data is ready AND the progress animation completes
  if (isLoading || !isComplete) {
    return <CircularProgressFullscreen progress={progress} />;
  }

  // Error state
  if (error) {
    let errorMessage =
      'Something went wrong while analyzing the vibe compatibility. Please try again.';
    let errorHint = '';

    if (error instanceof VibeAPIError) {
      errorMessage = error.message;

      // Provide user-friendly hints based on error type
      if (error.status === 402 || 
          error.message.toLowerCase().includes('credit') ||
          error.message.toLowerCase().includes('quota') ||
          error.message.toLowerCase().includes('marsc_hb') ||
          error.message.toLowerCase().includes('richkuo7')) {
        errorMessage = 'App Credits Exhausted';
        errorHint = 'Please let marsc_hb or richkuo7 know that the app is out of credits and we will top up';
      } else if (error.status === 408 || error.message.includes('timed out')) {
        errorHint =
          'The analysis took too long to complete. Try using shorter usernames or try again later when the service is less busy.';
      } else if (error.status === 0 || error.message.includes('Network error')) {
        errorHint =
          'This might be a connection issue. Please check your internet connection and try again.';
      } else if (error.status === 429) {
        errorHint = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.status >= 500) {
        errorHint = 'Our servers are experiencing issues. Please try again later.';
      } else if (error.status === 404) {
        errorHint = 'One or both usernames might not exist on X/Twitter.';
      }
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

          {/* Additional Help Text */}
          <p className="mt-8 text-xs text-white/40">
            If this problem persists, please try with different usernames or contact support.
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
