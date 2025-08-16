'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBotIdProtection } from '@/components/providers/BotIdProvider';
import { Loader2, AlertCircle } from 'lucide-react';

export function Hero() {
  const [userOne, setUserOne] = useState('');
  const [userTwo, setUserTwo] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    compatibility: string;
    summary?: string;
  } | null>(null);

  const { isProtected, shouldDisableAction } = useBotIdProtection('/api/vibe/analyze');

  const handleAnalyze = async () => {
    if (!userOne || !userTwo) {
      setError('Please enter both usernames');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/vibe/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userOne: userOne.replace('@', ''),
          userTwo: userTwo.replace('@', ''),
          analysisDepth: 'standard',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze vibe');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };
  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden px-6">
      <div className="gradient-bg absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm">
          <span className="bg-primary mr-2 h-2 w-2 rounded-full"></span>X Vibe Matching AI
        </div>

        <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          The <span className="gradient-text">Vibe Compatibility</span> Framework
        </h1>

        <div className="mx-auto mb-10 max-w-2xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-3">
            <div className="relative flex flex-1 items-center rounded-md border border-white/20 bg-white/10 backdrop-blur-sm">
              <span className="pr-1 pl-3 text-white/70 select-none">@</span>
              <Input
                type="text"
                placeholder="marsc_hb"
                value={userOne}
                onChange={(e) => setUserOne(e.target.value)}
                disabled={isAnalyzing}
                aria-label="First username input"
                className="border-0 bg-transparent text-white shadow-none placeholder:text-white/50 focus-visible:ring-0"
              />
            </div>

            <div className="relative flex flex-1 items-center rounded-md border border-white/20 bg-white/10 backdrop-blur-sm">
              <span className="pr-1 pl-3 text-white/70 select-none">@</span>
              <Input
                type="text"
                placeholder="richkuo7"
                value={userTwo}
                onChange={(e) => setUserTwo(e.target.value)}
                disabled={isAnalyzing}
                aria-label="Second username input"
                className="border-0 bg-transparent text-white shadow-none placeholder:text-white/50 focus-visible:ring-0"
              />
            </div>

            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={isAnalyzing || shouldDisableAction || !userOne || !userTwo}
              aria-label="Analyze vibe match"
              className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px] sm:flex-shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Vibe'
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 flex items-center justify-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {isProtected && (
            <div className="mt-2 text-center text-xs text-white/50">Protected by Bot ID</div>
          )}
        </div>

        {result && (
          <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-2xl font-bold text-white">Vibe Analysis Result</h2>
            <div className="space-y-2 text-white/80">
              <p>
                <strong>Score:</strong> {result.score}/100
              </p>
              <p>
                <strong>Compatibility:</strong> {result.compatibility}
              </p>
              {result.summary && <p className="mt-4">{result.summary}</p>}
            </div>
          </div>
        )}

        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70 sm:text-xl">
          Tired of repetitive timelines filled with AI-generated content? Verify authentic
          connections before you follow.
        </p>
      </div>
    </section>
  );
}
