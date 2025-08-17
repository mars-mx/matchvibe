'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VibeAnalyzerForm } from '@/features/vibe-analysis/components/vibe-analyzer-form';
import { AnalysisResults } from './results';
import type { FormState } from '@/features/vibe-analysis/actions/analyze.action';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface VibeAnalyzerProps {
  className?: string;
  showTitle?: boolean;
  defaultUserOne?: string;
  defaultUserTwo?: string;
}

export function VibeAnalyzer({
  className,
  showTitle = true,
  defaultUserOne,
  defaultUserTwo,
}: VibeAnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<FormState | null>(null);

  const handleSuccess = (result: FormState) => {
    setAnalysisResult(result);
  };

  return (
    <div className={cn('mx-auto w-full max-w-4xl', className)}>
      <Card className="overflow-hidden">
        {showTitle && (
          <>
            <div className="from-primary/10 via-primary/5 bg-gradient-to-r to-transparent p-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Sparkles className="text-primary h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Vibe Compatibility Analyzer</h2>
                  <p className="text-muted-foreground text-sm">
                    Discover how well two X users vibe together
                  </p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        <div className="p-6">
          <VibeAnalyzerForm
            onSuccess={handleSuccess}
            defaultUserOne={defaultUserOne}
            defaultUserTwo={defaultUserTwo}
          />
        </div>
      </Card>

      {analysisResult?.success && analysisResult.result && (
        <div className="mt-8">
          <AnalysisResults result={analysisResult.result} />
        </div>
      )}
    </div>
  );
}
