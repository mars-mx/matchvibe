'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VibeAnalysisFormProps {
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  disabled?: boolean;
  error?: string | null;
  className?: string;
}

export function VibeAnalysisForm({
  onSubmit,
  isPending,
  disabled = false,
  error,
  className,
}: VibeAnalysisFormProps) {
  return (
    <form action={onSubmit} className={cn('mx-auto mb-10 max-w-2xl', className)}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-3">
        {/* First Username Input */}
        <div className="relative flex flex-1 items-center rounded-md border border-white/20 bg-white/10 backdrop-blur-sm">
          <span className="pr-1 pl-3 text-white/70 select-none">@</span>
          <Input
            type="text"
            name="userOne"
            placeholder="marsc_hb"
            disabled={isPending || disabled}
            required
            aria-label="First username input"
            className="border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* X Symbol */}
        <span className="text-white/50 select-none">×</span>

        {/* Second Username Input */}
        <div className="relative flex flex-1 items-center rounded-md border border-white/20 bg-white/10 backdrop-blur-sm">
          <span className="pr-1 pl-3 text-white/70 select-none">@</span>
          <Input
            type="text"
            name="userTwo"
            placeholder="richkuo7"
            disabled={isPending || disabled}
            required
            aria-label="Second username input"
            className="border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      {/* Hidden Analysis Depth Field */}
      <input type="hidden" name="analysisDepth" value="standard" />

      {/* Submit Button */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={isPending || disabled}
          className="from-primary/10 to-primary/5 hover:from-primary/15 hover:via-primary/5 hover:to-primary/10 group relative overflow-hidden border border-white/20 bg-gradient-to-r via-transparent text-white backdrop-blur-sm transition-all duration-500 ease-out hover:border-white/30 hover:shadow-lg hover:shadow-white/5"
        >
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />

          <span className="relative z-10 flex items-center">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Vibes...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Vibe
              </>
            )}
          </span>
        </Button>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </form>
  );
}
