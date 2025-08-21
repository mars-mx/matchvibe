'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';
import { calculateAnalysisDuration } from '@/features/vibe-analysis/lib/api-client';
import { cn } from '@/lib/utils';
import { Users, Calendar, BarChart3 } from 'lucide-react';

interface AnalysisCardProps {
  result: VibeAnalysisResult;
  className?: string;
}

export function AnalysisCard({ result, className }: AnalysisCardProps) {
  const { analysis, metadata } = result;
  const duration = calculateAnalysisDuration(metadata.timestamp);

  return (
    <Card className={cn('liquid-glass-card overflow-hidden', className)}>
      <CardHeader className="relative z-10 space-y-1">
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
      <CardContent className="relative z-10">
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
