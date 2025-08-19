'use client';

import { VibeScore } from '@/features/vibe-analysis/components/vibe-score';
import { MetricsSection } from '@/features/vibe-analysis/components/metrics-section';
import { ShareResults } from '@/features/vibe-analysis/components/share-results';
import { LinkedText } from '@/components/ui/linked-text';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';
import { cn } from '@/lib/utils';

interface VibeAnalysisResultsProps {
  result: VibeAnalysisResult;
  className?: string;
}

export function VibeAnalysisResults({ result, className }: VibeAnalysisResultsProps) {
  const hasBreakdown =
    (result.strengths?.length ?? 0) > 0 ||
    (result.challenges?.length ?? 0) > 0 ||
    (result.sharedInterests?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        'animate-in fade-in-0 slide-in-from-bottom-4 mx-auto max-w-4xl space-y-6 duration-700',
        className
      )}
    >
      {/* Score Card with Metrics */}
      <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <div className="flex flex-col justify-center">
            <VibeScore score={result.score} size="lg" className="vibe-score-hero" />
          </div>
          {result.profiles && (
            <div className="flex flex-col justify-center">
              <MetricsSection profiles={result.profiles} showAnimation={true} />
            </div>
          )}
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-2xl font-bold text-white">Analysis Summary</h2>
        <LinkedText text={result.analysis} className="leading-relaxed text-white/80" />
      </div>

      {/* Breakdown Grid */}
      {hasBreakdown && (
        <div className="grid gap-4 md:grid-cols-3">
          {result.strengths && result.strengths.length > 0 && (
            <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="mb-3 font-semibold text-green-400">Strengths</h3>
              <ul className="space-y-2 text-sm text-white/70">
                {result.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-400">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.challenges && result.challenges.length > 0 && (
            <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="mb-3 font-semibold text-yellow-400">Challenges</h3>
              <ul className="space-y-2 text-sm text-white/70">
                {result.challenges.map((challenge, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-yellow-400">!</span>
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.sharedInterests && result.sharedInterests.length > 0 && (
            <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <h3 className="mb-3 font-semibold text-blue-400">Shared Interests</h3>
              <div className="flex flex-wrap gap-2">
                {result.sharedInterests.map((interest, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/70"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share Section */}
      <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
        <ShareResults result={result} variant="compact" className="share-results-hero" />
      </div>
    </div>
  );
}
