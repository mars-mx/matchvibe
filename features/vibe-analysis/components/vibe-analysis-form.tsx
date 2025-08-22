'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlassInput } from '@/components/ui/glass-input';
import { AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VibeAnalysisFormProps {
  className?: string;
}

export function VibeAnalysisForm({ className }: VibeAnalysisFormProps) {
  const router = useRouter();
  const [userOne, setUserOne] = useState('');
  const [userTwo, setUserTwo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    setError(null);

    // Validate inputs
    const cleanUserOne = userOne.trim().replace('@', '');
    const cleanUserTwo = userTwo.trim().replace('@', '');

    if (!cleanUserOne) {
      setError('Please enter the first username');
      return;
    }

    if (!cleanUserTwo) {
      setError('Please enter the second username');
      return;
    }

    if (cleanUserOne.toLowerCase() === cleanUserTwo.toLowerCase()) {
      setError('Please enter two different usernames');
      return;
    }

    // Set submitting state and navigate
    setIsSubmitting(true);
    router.push(`/vibe/${cleanUserOne}/${cleanUserTwo}`);

    // Reset submitting state after navigation
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('mx-auto mb-6 w-full max-w-2xl sm:mb-10', className)}
      autoComplete="off"
      data-form-type="other"
      noValidate
    >
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-3">
        {/* First Username Input - Full width on mobile */}
        <div className="min-w-0 flex-1">
          <GlassInput
            name="userOne"
            placeholder="marsc_hb"
            prefix="@"
            value={userOne}
            onChange={(e) => setUserOne(e.target.value)}
            required
            aria-label="First username input"
            antiAutofill={true}
            className="w-full text-base sm:text-sm"
          />
        </div>

        {/* X Symbol - Hidden on mobile */}
        <span className="hidden text-xl font-light text-white/60 select-none sm:inline">×</span>

        {/* VS divider for mobile only */}
        <div className="flex items-center justify-center py-1 sm:hidden">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
            VS
          </span>
        </div>

        {/* Second Username Input - Full width on mobile */}
        <div className="min-w-0 flex-1">
          <GlassInput
            name="userTwo"
            placeholder="richkuo7"
            prefix="@"
            value={userTwo}
            onChange={(e) => setUserTwo(e.target.value)}
            required
            aria-label="Second username input"
            antiAutofill={true}
            className="w-full text-base sm:text-sm"
          />
        </div>
      </div>

      {/* Submit Button - Enhanced mobile experience */}
      <div className="mt-6 flex flex-col items-center gap-3 sm:gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="from-primary/10 to-primary/5 hover:from-primary/15 hover:via-primary/5 hover:to-primary/10 group relative min-h-[48px] w-full touch-manipulation overflow-hidden border border-white/20 bg-gradient-to-r via-transparent px-8 text-white backdrop-blur-sm transition-all duration-500 ease-out hover:border-white/30 hover:shadow-lg hover:shadow-white/5 active:scale-[0.98] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {/* Glass morphism inner glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 opacity-50" />

          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />

          <span className="relative z-10 flex items-center text-base font-medium sm:text-sm">
            <Sparkles className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
            Analyze Vibe
          </span>
        </Button>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{error}</span>
          </div>
        )}
      </div>
    </form>
  );
}
