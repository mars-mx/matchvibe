import { analyzeVibeService } from '@/features/vibe-analysis/services/analyze.service';
import { VibeScore } from '@/features/vibe-analysis/components/vibe-score';
import { ShareResults } from '@/features/vibe-analysis/components/share-results';
import { LinkedText } from '@/components/ui/linked-text';
import { cn } from '@/lib/utils';
import { verifyBotId, shouldBlockRequest } from '@/lib/security/botid';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    user1: string;
    user2: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { user1, user2 } = await params;

  return {
    title: `Vibe Analysis: @${user1} × @${user2} | Match Vibe`,
    description: `AI-powered vibe compatibility analysis between @${user1} and @${user2}`,
  };
}

export default async function VibePage({ params }: PageProps) {
  const { user1, user2 } = await params;

  // Bot protection check (only in production)
  if (process.env.NODE_ENV === 'production') {
    const botResult = await verifyBotId();
    if (shouldBlockRequest(botResult)) {
      notFound(); // Return 404 for bot traffic
    }
  }

  // Fetch vibe analysis data (this happens on the server)
  const result = await analyzeVibeService(user1, user2, 'standard');

  const hasBreakdown =
    (result.strengths?.length ?? 0) > 0 ||
    (result.challenges?.length ?? 0) > 0 ||
    (result.sharedInterests?.length ?? 0) > 0;

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

        {/* Results - Scrollable on mobile, fixed grid on desktop */}
        <div
          className={cn(
            'animate-in fade-in-0 slide-in-from-bottom-4 mx-auto w-full max-w-5xl flex-1 space-y-4 duration-700 md:flex md:flex-col md:space-y-3'
          )}
        >
          {/* Score and Summary Row */}
          <div className="space-y-4 md:flex md:gap-4 md:space-y-0">
            {/* Score Card - Smaller on desktop */}
            <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:w-2/5 md:p-5">
              <VibeScore score={result.score} size="lg" className="vibe-score-hero" />
            </div>

            {/* Analysis Summary - Beside score on desktop */}
            <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:flex-1 md:p-5">
              <h2 className="mb-2 text-xl font-bold text-white md:mb-3 md:text-2xl">
                Analysis Summary
              </h2>
              <LinkedText
                text={result.analysis}
                className="text-sm leading-relaxed text-white/80 md:text-base"
              />
            </div>
          </div>

          {/* Breakdown Grid - More compact */}
          {hasBreakdown && (
            <div className="grid gap-3 md:grid-cols-3 md:gap-4">
              {result.strengths && result.strengths.length > 0 && (
                <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm md:p-4">
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
                <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm md:p-4">
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

              {result.sharedInterests && result.sharedInterests.length > 0 && (
                <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm md:p-4">
                  <h3 className="mb-2 font-semibold text-blue-400 md:mb-3">Shared Interests</h3>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {result.sharedInterests.slice(0, 6).map((interest, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-white/70 md:px-3 md:py-1"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Share Section - Compact */}
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm md:p-4">
            <ShareResults result={result} variant="compact" className="share-results-hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
