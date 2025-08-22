'use client';

import { useRouter } from 'next/navigation';
import { VibeScore } from '@/features/vibe-analysis/components/vibe-score';
import { DimensionBreakdown } from '@/features/vibe-analysis/components/dimension-breakdown';
import { ShareResults } from '@/features/vibe-analysis/components/share-results';
import { LinkedText } from '@/components/ui/linked-text';
import { Button } from '@/components/ui/button';
import { getCompatibilityLevel } from '@/features/vibe-analysis/lib/api-client';
import { ArrowLeft } from 'lucide-react';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';

interface VibeResultsWrapperProps {
  result: VibeAnalysisResult;
  user1: string;
  user2: string;
}

export function VibeResultsWrapper({ result, user1, user2 }: VibeResultsWrapperProps) {
  const router = useRouter();
  const compatibility = getCompatibilityLevel(result.score);
  const scoreClass = `liquid-glass-card-${compatibility.level}`;

  return (
    <section className="relative flex h-screen flex-col overflow-hidden">
      <div className="gradient-bg absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col px-4 py-4 sm:px-6 md:py-6">
        {/* Three-Column Header */}
        <div className="mb-4 flex-shrink-0 md:mb-6">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Left Column - Back Button */}
            <div className="flex justify-start">
              <Button
                onClick={() => router.push('/')}
                size="sm"
                className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </div>

            {/* Center Column - User Tags */}
            <h1 className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl">
              <span className="gradient-text">@{user1}</span>
              <span className="mx-2 text-white/60">×</span>
              <span className="gradient-text">@{user2}</span>
            </h1>

            {/* Right Column - Share Buttons */}
            <div className="flex justify-end">
              <ShareResults result={result} variant="compact" />
            </div>
          </div>
        </div>

        {/* Two Column Layout - Desktop */}
        <div className="mx-auto w-full max-w-7xl flex-1 overflow-hidden">
          <div className="h-full md:grid md:grid-cols-2 md:items-stretch md:gap-6">
            {/* Left Column - Score, Summary, Strengths/Challenges */}
            <div className="h-full overflow-y-auto md:pr-2">
              <div className="flex h-full flex-col justify-between space-y-4">
                {/* Score Card */}
                <div
                  className={`vibe-result-card vibe-score-appear liquid-glass-card liquid-glass-card-intense ${scoreClass} rounded-lg p-4 md:p-5`}
                >
                  <div className="liquid-glass-inner-glow" />
                  <div className="relative z-10">
                    <VibeScore score={result.score} size="lg" className="vibe-score-hero" />

                    {/* Shared Interests Tags */}
                    {result.sharedInterests && result.sharedInterests.length > 0 && (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <h3 className="mb-2 text-sm font-semibold text-blue-400">
                          Shared Interests
                        </h3>
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
                </div>

                {/* Analysis Summary - Fixed Height */}
                <div className="liquid-glass-card rounded-lg p-4 md:p-5">
                  <h2 className="mb-2 text-xl font-bold text-white md:mb-3 md:text-2xl">
                    Analysis Summary
                  </h2>
                  <LinkedText
                    text={result.analysis}
                    className="text-sm leading-relaxed text-white/80 md:text-base"
                  />
                </div>

                {/* Strengths and Challenges - Side by Side */}
                {(result.strengths?.length || result.challenges?.length) && (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {result.strengths && result.strengths.length > 0 && (
                      <div className="liquid-glass-card-subtle rounded-lg p-3 md:p-4">
                        <h3 className="mb-2 text-sm font-semibold text-green-400 md:text-base">
                          Strengths
                        </h3>
                        <ul className="space-y-1.5 text-xs text-white/70">
                          {result.strengths.slice(0, 3).map((strength, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="mt-0.5 flex-shrink-0 text-green-400">✓</span>
                              <span className="line-clamp-2">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.challenges && result.challenges.length > 0 && (
                      <div className="liquid-glass-card-subtle rounded-lg p-3 md:p-4">
                        <h3 className="mb-2 text-sm font-semibold text-yellow-400 md:text-base">
                          Challenges
                        </h3>
                        <ul className="space-y-1.5 text-xs text-white/70">
                          {result.challenges.slice(0, 3).map((challenge, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="mt-0.5 flex-shrink-0 text-yellow-400">!</span>
                              <span className="line-clamp-2">{challenge}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile Share Section - Only show on mobile */}
                <div className="liquid-glass-card-subtle rounded-lg p-3 md:hidden">
                  <ShareResults result={result} variant="compact" className="share-results-hero" />
                </div>
              </div>
            </div>

            {/* Right Column - Full Height Personality Dimensions */}
            <div className="mt-6 md:mt-0 md:h-full">
              <div className="liquid-glass-card-subtle h-full overflow-y-auto rounded-lg p-4 md:p-5">
                <DimensionBreakdown profiles={result.profiles} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
