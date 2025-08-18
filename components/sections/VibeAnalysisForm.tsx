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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    // Navigate to results page immediately
    router.push(`/vibe/${cleanUserOne}/${cleanUserTwo}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('mx-auto mb-10 max-w-2xl', className)}
      autoComplete="off"
      data-form-type="other"
      noValidate
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-3">
        {/* First Username Input */}
        <GlassInput
          name="userOne"
          placeholder="marsc_hb"
          prefix="@"
          value={userOne}
          onChange={(e) => setUserOne(e.target.value)}
          required
          aria-label="First username input"
          antiAutofill={true}
        />

        {/* X Symbol */}
        <span className="text-xl font-light text-white/60 select-none">×</span>

        {/* Second Username Input */}
        <GlassInput
          name="userTwo"
          placeholder="richkuo7"
          prefix="@"
          value={userTwo}
          onChange={(e) => setUserTwo(e.target.value)}
          required
          aria-label="Second username input"
          antiAutofill={true}
        />
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <Button
          type="submit"
          size="lg"
          className="from-primary/10 to-primary/5 hover:from-primary/15 hover:via-primary/5 hover:to-primary/10 group relative overflow-hidden border border-white/20 bg-gradient-to-r via-transparent text-white backdrop-blur-sm transition-all duration-500 ease-out hover:border-white/30 hover:shadow-lg hover:shadow-white/5"
        >
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />

          <span className="relative z-10 flex items-center">
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze Vibe
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
