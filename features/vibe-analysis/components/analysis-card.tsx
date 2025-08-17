'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';
import { calculateAnalysisDuration } from '@/features/vibe-analysis/lib/api-client';
import { cn } from '@/lib/utils';
import { Users, Calendar, BarChart3 } from 'lucide-react';

interface AnalysisCardProps {
  result: VibeAnalysisResult;
  className?: string;
  loading?: boolean;
}

export function AnalysisCard({ result, className, loading = false }: AnalysisCardProps) {
  if (loading) {
    return <AnalysisCardSkeleton className={className} />;
  }

  const { analysis, metadata } = result;
  const duration = calculateAnalysisDuration(metadata.timestamp);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">Analysis Summary</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {metadata.sourcesUsed} sources analyzed
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />@{metadata.userOne} × @{metadata.userTwo}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {duration}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">{analysis}</p>

          {metadata.sourcesUsed > 0 && (
            <div className="bg-muted/30 flex items-center gap-2 rounded-lg border p-3">
              <BarChart3 className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-xs">
                Analysis based on {metadata.sourcesUsed} recent posts and interactions
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
