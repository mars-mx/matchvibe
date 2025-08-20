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
  console.log('[fetchVibeAnalysis] Starting analysis request', {
    user1,
    user2,
    analysisDepth,
    timestamp: new Date().toISOString(),
  });

  // Clean usernames (remove @ if present)
  const cleanUser1 = user1.replace('@', '').trim();
  const cleanUser2 = user2.replace('@', '').trim();

  console.log('[fetchVibeAnalysis] Cleaned usernames', {
    originalUser1: user1,
    originalUser2: user2,
    cleanUser1,
    cleanUser2,
  });

  // Add timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('[fetchVibeAnalysis] Request timed out after 55 seconds');
    controller.abort();
  }, 55000); // 55 seconds client timeout (5 seconds before server timeout)

  try {
    const requestBody = {
      userOne: cleanUser1,
      userTwo: cleanUser2,
      analysisDepth,
    };

    console.log('[fetchVibeAnalysis] Making API request', {
      url: '/api/vibe/analyze',
      method: 'POST',
      body: requestBody,
    });

    const response = await fetch('/api/vibe/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[fetchVibeAnalysis] Received response', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    });

    const data = await response.json();

    console.log('[fetchVibeAnalysis] Parsed response data', {
      dataType: typeof data,
      dataKeys: data && typeof data === 'object' ? Object.keys(data) : null,
      hasError: !!data?.error,
      hasResults: !!data?.results || !!data?.analysis,
    });

    if (!response.ok) {
      console.error('[fetchVibeAnalysis] API error response', {
        status: response.status,
        statusText: response.statusText,
        error: data.error,
        details: data.details,
        issues: data.issues,
      });

      throw new VibeAPIError(
        data.error || 'Failed to analyze vibe compatibility',
        response.status,
        data.details || data.issues
      );
    }

    console.log('[fetchVibeAnalysis] Success! Returning analysis result', {
      resultType: typeof data,
      hasVibeScore: !!data?.vibeScore,
      hasCompatibility: !!data?.compatibility,
      hasAnalysis: !!data?.analysis,
    });

    return data as VibeAnalysisResult;
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);

    console.error('[fetchVibeAnalysis] Caught error', {
      errorType: error?.constructor?.name,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      isVibeAPIError: error instanceof VibeAPIError,
      isAbortError: error instanceof Error && error.name === 'AbortError',
      fullError: error,
    });

    // Re-throw VibeAPIError
    if (error instanceof VibeAPIError) {
      console.log('[fetchVibeAnalysis] Re-throwing VibeAPIError', {
        message: error.message,
        status: error.status,
        details: error.details,
      });
      throw error;
    }

    // Check for timeout/abort error
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[fetchVibeAnalysis] Request aborted/timed out');
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

    console.error('[fetchVibeAnalysis] Network/other error', {
      errorMessage,
      errorDetails,
      isClientSide: typeof window !== 'undefined',
      isDevelopment: process.env.NODE_ENV === 'development',
    });

    // Log detailed error in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('[VibeAPIClient] Network error:', errorDetails);
    }

    throw new VibeAPIError(`Network error: ${errorMessage}`, 0, errorDetails);
  }
}
