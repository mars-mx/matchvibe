'use client';

import { VibeScore } from '@/features/vibe-analysis/components/vibe-score';
import { AnalysisCard } from '@/features/vibe-analysis/components/analysis-card';
import { CompatibilityBreakdown } from '@/features/vibe-analysis/components/compatibility-breakdown';
import { ShareResults } from '@/features/vibe-analysis/components/share-results';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';
import { cn } from '@/lib/utils';

interface AnalysisResultsProps {
  result: VibeAnalysisResult;
  className?: string;
  loading?: boolean;
}

export function AnalysisResults({ result, className, loading = false }: AnalysisResultsProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <VibeScore score={result.score} size="lg" showAnimation={!loading} />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 delay-150 duration-700">
        <AnalysisCard result={result} />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 delay-300 duration-700">
        <CompatibilityBreakdown result={result} />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 delay-500 duration-700">
        <ShareResults result={result} />
      </div>
    </div>
  );
}
