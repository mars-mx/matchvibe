'use client';

import { useActionState } from 'react';
import { useBotIdProtection } from '@/components/providers/BotIdProvider';
import { analyzeVibeAction, type FormState } from '@/features/vibe-analysis/actions/analyze.action';
import { VibeAnalysisForm } from './VibeAnalysisForm';
import { VibeAnalysisResults } from './VibeAnalysisResults';

const initialState: FormState = {
  success: false,
};

export function Hero() {
  const { isProtected, shouldDisableAction } = useBotIdProtection('/api/vibe/analyze');

  const [state, formAction, isPending] = useActionState(analyzeVibeAction, initialState);

  const errorMessage =
    state?.errors?.general?.join(', ') || (!state?.success && state?.message) || null;
  const result = state?.success && state?.result ? state.result : null;

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div className="gradient-bg absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm">
          <span className="bg-primary mr-2 h-2 w-2 rounded-full"></span>X Vibe Matching AI
        </div>

        {/* Title */}
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          The <span className="gradient-text">Vibe Compatibility</span> Framework
        </h1>

        {/* Analysis Form */}
        <VibeAnalysisForm
          onSubmit={formAction}
          isPending={isPending}
          disabled={shouldDisableAction}
          error={errorMessage}
        />

        {/* Bot Protection Indicator */}
        {isProtected && (
          <div className="mt-2 text-center text-xs text-white/50">Protected by Bot ID</div>
        )}

        {/* Results Display */}
        {result && <VibeAnalysisResults result={result} />}

        {/* Footer Text */}
        <p className="mx-auto mt-10 max-w-2xl text-lg text-white/70 sm:text-xl">
          Tired of repetitive timelines filled with AI-generated content? Verify authentic
          connections before you follow.
        </p>
      </div>
    </section>
  );
}
