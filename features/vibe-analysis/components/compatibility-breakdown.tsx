'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';
import { cn } from '@/lib/utils';
import { ThumbsUp, AlertCircle, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface CompatibilityBreakdownProps {
  result: VibeAnalysisResult;
  className?: string;
}

export function CompatibilityBreakdown({ result, className }: CompatibilityBreakdownProps) {
  const { strengths, challenges, sharedInterests } = result;

  const hasContent =
    (strengths && strengths.length > 0) ||
    (challenges && challenges.length > 0) ||
    (sharedInterests && sharedInterests.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <div className={cn('grid gap-4 md:grid-cols-3', className)}>
      {strengths && strengths.length > 0 && (
        <Card className="liquid-glass-card-subtle">
          <CardHeader className="relative z-10 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ThumbsUp className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                  <span className="text-muted-foreground text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {challenges && challenges.length > 0 && (
        <Card className="liquid-glass-card-subtle">
          <CardHeader className="relative z-10 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-yellow-500" />
              Challenges
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <ul className="space-y-2">
              {challenges.map((challenge, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-yellow-500" />
                  <span className="text-muted-foreground text-sm">{challenge}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {sharedInterests && sharedInterests.length > 0 && (
        <Card className="liquid-glass-card-subtle">
          <CardHeader className="relative z-10 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Shared Interests
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-wrap gap-2">
              {sharedInterests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
