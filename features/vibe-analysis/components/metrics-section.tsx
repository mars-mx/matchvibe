'use client';

import { DotPlotMetric } from './dot-plot-metric';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/features/vibe-analysis/types';

interface MetricsSectionProps {
  profiles?: {
    user1: UserProfile;
    user2: UserProfile;
  };
  showAnimation?: boolean;
  className?: string;
}

export function MetricsSection({ profiles, showAnimation = true, className }: MetricsSectionProps) {
  if (!profiles) {
    return null;
  }

  // Extract metrics from profiles
  const metrics = {
    user1: {
      shitpostRating: profiles.user1.contentStyle.shitpostRating,
      memeRating: profiles.user1.contentStyle.memeRating,
      intellectualRating: profiles.user1.contentStyle.intellectualRating,
    },
    user2: {
      shitpostRating: profiles.user2.contentStyle.shitpostRating,
      memeRating: profiles.user2.contentStyle.memeRating,
      intellectualRating: profiles.user2.contentStyle.intellectualRating,
    },
  };

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-medium text-white/80">Compatibility Metrics</h3>

      <div className="space-y-3">
        <DotPlotMetric
          label="Humor Alignment"
          value1={metrics.user1.shitpostRating}
          value2={metrics.user2.shitpostRating}
          user1Name={profiles.user1.username}
          user2Name={profiles.user2.username}
          showAnimation={showAnimation}
          delay={0}
        />

        <DotPlotMetric
          label="Meme Wavelength"
          value1={metrics.user1.memeRating}
          value2={metrics.user2.memeRating}
          user1Name={profiles.user1.username}
          user2Name={profiles.user2.username}
          showAnimation={showAnimation}
          delay={200}
        />

        <DotPlotMetric
          label="Intellectual Depth"
          value1={metrics.user1.intellectualRating}
          value2={metrics.user2.intellectualRating}
          user1Name={profiles.user1.username}
          user2Name={profiles.user2.username}
          showAnimation={showAnimation}
          delay={400}
        />
      </div>
    </div>
  );
}
