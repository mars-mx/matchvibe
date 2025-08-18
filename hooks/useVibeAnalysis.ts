'use client';

import { useState, useCallback } from 'react';

export interface UserData {
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  tweetCount?: number;
  verified?: boolean;
}

/**
 * Hook for vibe analysis functionality
 * Note: Currently using server-side analysis via analyze.service.ts
 * This hook provides client-side state management if needed
 */
export function useVibeAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeCompatibility = useCallback(async (user1: string, user2: string) => {
    try {
      setIsAnalyzing(true);
      setError(null);

      // Call the API endpoint for analysis
      const response = await fetch('/api/vibe/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user1, user2 }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeCompatibility,
    resetAnalysis,
  };
}
