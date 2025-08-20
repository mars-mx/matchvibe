import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';

/**
 * Client-side API for vibe analysis
 */

export interface VibeAnalysisRequest {
  user1: string;
  user2: string;
  analysisDepth?: 'quick' | 'standard' | 'deep';
}

export class VibeAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'VibeAPIError';
  }
}

/**
 * Fetch vibe analysis from the API
 * @param user1 - First username (without @)
 * @param user2 - Second username (without @)
 * @param analysisDepth - Depth of analysis (default: standard)
 * @returns Vibe analysis result
 * @throws {VibeAPIError} If the API request fails
 */
export async function fetchVibeAnalysis(
  user1: string,
  user2: string,
  analysisDepth: 'quick' | 'standard' | 'deep' = 'standard'
): Promise<VibeAnalysisResult> {
  // Clean usernames (remove @ if present)
  const cleanUser1 = user1.replace('@', '').trim();
  const cleanUser2 = user2.replace('@', '').trim();

  // Add timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 seconds client timeout (5 seconds before server timeout)

  try {
    const response = await fetch('/api/vibe/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userOne: cleanUser1,
        userTwo: cleanUser2,
        analysisDepth,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new VibeAPIError(
        data.error || 'Failed to analyze vibe compatibility',
        response.status,
        data.details || data.issues
      );
    }

    return data as VibeAnalysisResult;
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);

    // Re-throw VibeAPIError
    if (error instanceof VibeAPIError) {
      throw error;
    }

    // Check for timeout/abort error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new VibeAPIError(
        'Request timed out. The analysis is taking longer than expected. Please try again with simpler usernames or try again later.',
        408, // Request Timeout status code
        { timeout: true, duration: 55000 }
      );
    }

    // Network or other errors - provide more context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = {
      originalError: error,
      url: '/api/vibe/analyze',
      method: 'POST',
      users: { user1: cleanUser1, user2: cleanUser2 },
      analysisDepth,
      timestamp: new Date().toISOString(),
    };

    // Log detailed error in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('[VibeAPIClient] Network error:', errorDetails);
    }

    throw new VibeAPIError(`Network error: ${errorMessage}`, 0, errorDetails);
  }
}
