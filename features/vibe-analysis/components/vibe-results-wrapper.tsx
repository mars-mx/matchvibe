import { Suspense } from 'react';
import { VibeScore } from '@/features/vibe-analysis/components/vibe-score';
import { ShareResults } from '@/features/vibe-analysis/components/share-results';
import { LinkedText } from '@/components/ui/linked-text';
import { getCompatibilityLevel } from '@/features/vibe-analysis/lib/api-client';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';

interface VibeResultsWrapperProps {
  result: VibeAnalysisResult;
  user1: string;
  user2: string;
}

// Loading skeletons for individual sections
function ScoreSkeleton() {
  return <div className="h-[200px] animate-pulse rounded-lg bg-white/10" />;
}

function SummarySkeleton() {
  return <div className="h-[200px] animate-pulse rounded-lg bg-white/10" />;
}

function BreakdownSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 md:gap-4">
      <div className="h-[150px] animate-pulse rounded-lg bg-white/10" />
      <div className="h-[150px] animate-pulse rounded-lg bg-white/10" />
    </div>
  );
}

export function VibeResultsWrapper({ result, user1, user2 }: VibeResultsWrapperProps) {
  const compatibility = getCompatibilityLevel(result.score);
  const scoreClass = `liquid-glass-card-${compatibility.level}`;

  return (
    <section className="relative flex h-screen flex-col overflow-hidden md:overflow-hidden">
      <div className="gradient-bg absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col overflow-y-auto px-4 py-4 sm:px-6 md:overflow-y-auto md:py-6">
        {/* Header - Compact */}
        <div className="mb-4 flex-shrink-0 text-center md:mb-6">
          <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm md:mb-3 md:px-4 md:py-2 md:text-sm">
            <span className="bg-primary mr-2 h-1.5 w-1.5 rounded-full md:h-2 md:w-2"></span>
            Vibe Analysis Complete
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            <span className="gradient-text">@{user1}</span>
            <span className="mx-2 text-white/60 md:mx-3">×</span>
            <span className="gradient-text">@{user2}</span>
          </h1>
        </div>

        {/* Results with Suspense boundaries */}
        <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 md:flex md:flex-col md:space-y-3">
          {/* Score and Summary Row */}
          <div className="space-y-4 md:flex md:gap-4 md:space-y-0">
            {/* Score Card with Shared Interests */}
            <Suspense fallback={<ScoreSkeleton />}>
              <div
                className={`vibe-result-card vibe-result-card-1 vibe-score-appear liquid-glass-card liquid-glass-card-intense ${scoreClass} rounded-lg p-4 md:w-2/5 md:p-5`}
              >
                <div className="liquid-glass-inner-glow" />
                <VibeScore
                  score={result.score}
                  size="lg"
                  className="vibe-score-hero relative z-10"
                />

                {/* Shared Interests Tags */}
                {result.sharedInterests && result.sharedInterests.length > 0 && (
                  <div className="relative z-10 mt-4 border-t border-white/10 pt-4">
                    <h3 className="mb-2 text-sm font-semibold text-blue-400">Shared Interests</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.sharedInterests.slice(0, 6).map((interest, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-white/70"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Suspense>

            {/* Analysis Summary */}
            <Suspense fallback={<SummarySkeleton />}>
              <div className="vibe-result-card vibe-result-card-2 liquid-glass-card rounded-lg p-4 md:flex-1 md:p-5">
                <h2 className="mb-2 text-xl font-bold text-white md:mb-3 md:text-2xl">
                  Analysis Summary
                </h2>
                <LinkedText
                  text={result.analysis}
                  className="text-sm leading-relaxed text-white/80 md:text-base"
                />
              </div>
            </Suspense>
          </div>

          {/* Breakdown Grid - Two Columns */}
          {(result.strengths?.length || result.challenges?.length) && (
            <Suspense fallback={<BreakdownSkeleton />}>
              <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                {result.strengths && result.strengths.length > 0 && (
                  <div className="vibe-result-card vibe-result-card-3 liquid-glass-card-subtle rounded-lg p-3 md:p-4">
                    <h3 className="mb-2 font-semibold text-green-400 md:mb-3">Strengths</h3>
                    <ul className="space-y-1.5 text-xs text-white/70 md:space-y-2 md:text-sm">
                      {result.strengths.slice(0, 4).map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 text-green-400">✓</span>
                          <span className="line-clamp-2">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.challenges && result.challenges.length > 0 && (
                  <div className="vibe-result-card vibe-result-card-3 liquid-glass-card-subtle rounded-lg p-3 md:p-4">
                    <h3 className="mb-2 font-semibold text-yellow-400 md:mb-3">Challenges</h3>
                    <ul className="space-y-1.5 text-xs text-white/70 md:space-y-2 md:text-sm">
                      {result.challenges.slice(0, 4).map((challenge, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 text-yellow-400">!</span>
                          <span className="line-clamp-2">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Suspense>
          )}

          {/* Share Section */}
          <div className="vibe-result-card vibe-result-card-5 liquid-glass-card-subtle rounded-lg p-3 md:p-4">
            <ShareResults result={result} variant="compact" className="share-results-hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
