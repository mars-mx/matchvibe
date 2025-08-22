'use client';

import { cn } from '@/lib/utils';
import { DotPlotMetric } from './dot-plot-metric';
import type { UserProfile } from '@/features/vibe-analysis/types';

interface DimensionBreakdownProps {
  profiles?: {
    user1: UserProfile;
    user2: UserProfile;
  };
  className?: string;
}

// All dimensions in a flat list for grid layout
const ALL_DIMENSIONS = [
  { key: 'positivityRating' as keyof UserProfile['contentStyle'], label: 'Positivity' },
  { key: 'empathyRating' as keyof UserProfile['contentStyle'], label: 'Empathy' },
  { key: 'engagementRating' as keyof UserProfile['contentStyle'], label: 'Engagement' },
  { key: 'debateRating' as keyof UserProfile['contentStyle'], label: 'Debate Style' },
  { key: 'shitpostRating' as keyof UserProfile['contentStyle'], label: 'Shitposting' },
  { key: 'memeRating' as keyof UserProfile['contentStyle'], label: 'Meme Culture' },
  { key: 'intellectualRating' as keyof UserProfile['contentStyle'], label: 'Intellectual Depth' },
  { key: 'politicalRating' as keyof UserProfile['contentStyle'], label: 'Political Content' },
  { key: 'personalSharingRating' as keyof UserProfile['contentStyle'], label: 'Personal Sharing' },
  {
    key: 'inspirationalQuotesRating' as keyof UserProfile['contentStyle'],
    label: 'Inspirational Quotes',
  },
  { key: 'extroversionRating' as keyof UserProfile['contentStyle'], label: 'Extroversion' },
  { key: 'authenticityRating' as keyof UserProfile['contentStyle'], label: 'Authenticity' },
  { key: 'optimismRating' as keyof UserProfile['contentStyle'], label: 'Optimism' },
  { key: 'humorRating' as keyof UserProfile['contentStyle'], label: 'Humor Style' },
  { key: 'aiGeneratedRating' as keyof UserProfile['contentStyle'], label: 'AI Content' },
];

export function DimensionBreakdown({ profiles, className }: DimensionBreakdownProps) {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h3 className="mb-1 text-lg font-semibold text-white">Personality Dimensions</h3>
        <p className="text-xs text-white/50">Compatibility scores for each personality trait</p>
      </div>

      {/* Scrollable Dimensions Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {profiles ? (
            ALL_DIMENSIONS.map((dim, index) => (
              <div
                key={dim.key}
                className="vibe-result-card"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <DotPlotMetric
                  label={dim.label}
                  value1={profiles.user1.contentStyle[dim.key] as number | null}
                  value2={profiles.user2.contentStyle[dim.key] as number | null}
                  user1Name={profiles.user1.username}
                  user2Name={profiles.user2.username}
                  showAnimation={true}
                  delay={index * 100}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-sm text-white/50">Personality dimensions data not available</p>
                <p className="mt-2 text-xs text-white/30">Profile analysis in progress...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
