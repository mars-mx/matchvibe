'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Vibe analysis error:', error);
  }, [error]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="gradient-bg absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-md text-center">
        {/* Error Icon */}
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
          <AlertCircle className="h-10 w-10 text-red-400" />
        </div>

        {/* Error Title */}
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white">Vibe Analysis Failed</h1>

        {/* Error Message */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <p className="text-sm text-white/70">
            {error.message ||
              'Something went wrong while analyzing the vibe compatibility. Please try again.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
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
