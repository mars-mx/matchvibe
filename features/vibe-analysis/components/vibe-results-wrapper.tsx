'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VibeScore } from '@/features/vibe-analysis/components/vibe-score';
import { DimensionBreakdown } from '@/features/vibe-analysis/components/dimension-breakdown';
import { ShareResults } from '@/features/vibe-analysis/components/share-results';
import { LinkedText } from '@/components/ui/linked-text';
import { Button } from '@/components/ui/button';
import { BottomActionBar, ActionButton } from '@/components/ui/bottom-action-bar';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { getCompatibilityLevel } from '@/features/vibe-analysis/lib/api-client';
import { ArrowLeft, Share2, RefreshCw, Home, X } from 'lucide-react';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';

interface VibeResultsWrapperProps {
  result: VibeAnalysisResult;
  user1: string;
  user2: string;
}

export function VibeResultsWrapper({ result, user1, user2 }: VibeResultsWrapperProps) {
  const router = useRouter();
  const [showShareDrawer, setShowShareDrawer] = useState(false);
  const compatibility = getCompatibilityLevel(result.score);
  const scoreClass = `liquid-glass-card-${compatibility.level}`;

  const handleNewAnalysis = () => {
    router.push('/');
  };

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden md:overflow-hidden">
      <div className="gradient-bg absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col px-4 py-4 pb-24 sm:px-6 sm:pb-4 md:py-6 md:pb-6">
        {/* Mobile Header - Simplified */}
        <div className="mb-4 flex-shrink-0 md:hidden">
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight text-white">
              <span className="gradient-text">@{user1}</span>
              <span className="mx-1 text-sm text-white/60">×</span>
              <span className="gradient-text">@{user2}</span>
            </h1>
          </div>
        </div>

        {/* Desktop Header - Three Column Grid */}
        <div className="hidden flex-shrink-0 md:mb-6 md:block">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Left Column - Back Button */}
            <div className="flex justify-start">
              <Button
                onClick={() => router.push('/')}
                size="sm"
                className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
            </div>

            {/* Center Column - User Tags */}
            <h1 className="text-center text-2xl font-bold tracking-tight text-white lg:text-3xl">
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

        {/* Responsive Layout - Stack on Mobile, Two Column on Desktop */}
        <div className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto md:overflow-hidden">
          <div className="flex h-full flex-col gap-4 md:grid md:grid-cols-2 md:items-stretch md:gap-6">
            {/* Mobile: All cards stacked | Desktop: Left Column */}
            <div className="flex flex-col space-y-4 md:h-full md:overflow-y-auto md:pr-2">
              {/* Score Card - Full width on mobile */}
              <div
                className={`vibe-result-card vibe-score-appear liquid-glass-card liquid-glass-card-intense ${scoreClass} rounded-lg p-4 sm:p-5`}
              >
                <div className="liquid-glass-inner-glow" />
                <div className="relative z-10">
                  <VibeScore score={result.score} size="lg" className="vibe-score-hero" />

                  {/* Shared Interests Tags */}
                  {result.sharedInterests && result.sharedInterests.length > 0 && (
                    <div className="mt-4 border-t border-white/10 pt-4">
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
              </div>

              {/* Analysis Summary - Collapsible on mobile */}
              <div className="liquid-glass-card rounded-lg p-4 sm:p-5">
                <h2 className="mb-2 text-lg font-bold text-white sm:text-xl md:mb-3 md:text-2xl">
                  Analysis Summary
                </h2>
                <LinkedText
                  text={result.analysis}
                  className="text-sm leading-relaxed text-white/80 sm:text-base"
                />
              </div>

              {/* Strengths and Challenges - Stack on small mobile, side-by-side on larger */}
              {(result.strengths?.length || result.challenges?.length) && (
                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:gap-4">
                  {result.strengths && result.strengths.length > 0 && (
                    <div className="liquid-glass-card-subtle rounded-lg p-3 sm:p-4">
                      <h3 className="mb-2 text-sm font-semibold text-green-400 sm:text-base">
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
                    <div className="liquid-glass-card-subtle rounded-lg p-3 sm:p-4">
                      <h3 className="mb-2 text-sm font-semibold text-yellow-400 sm:text-base">
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
            </div>

            {/* Mobile: Bottom section | Desktop: Right Column - Personality Dimensions */}
            <div className="md:h-full">
              <div className="liquid-glass-card-subtle rounded-lg p-4 sm:p-5 md:h-full md:overflow-y-auto">
                <DimensionBreakdown profiles={result.profiles} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <BottomActionBar className="md:hidden">
        <div className="flex items-center justify-around">
          <ActionButton
            icon={<Home className="h-5 w-5" />}
            label="Home"
            onClick={() => router.push('/')}
          />
          <ActionButton
            icon={<Share2 className="h-5 w-5" />}
            label="Share"
            onClick={() => setShowShareDrawer(true)}
            active
          />
          <ActionButton
            icon={<RefreshCw className="h-5 w-5" />}
            label="New"
            onClick={handleNewAnalysis}
          />
        </div>
      </BottomActionBar>

      {/* Share Drawer for mobile */}
      <Drawer open={showShareDrawer} onOpenChange={setShowShareDrawer}>
        <DrawerContent className="border-t border-white/20 bg-black/90 backdrop-blur-xl">
          <DrawerHeader className="text-white">
            <DrawerTitle>Share Your Vibe Match</DrawerTitle>
            <DrawerDescription className="text-white/70">
              Share your compatibility score of {result.score}% between @{user1} and @{user2}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <ShareResults result={result} variant="default" className="w-full" />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
