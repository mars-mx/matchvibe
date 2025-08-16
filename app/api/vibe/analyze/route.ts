import { NextRequest, NextResponse } from 'next/server';
import { GrokService } from '@/features/vibe-analysis/services/grok.service';
import { vibeAnalysisRequestSchema } from '@/features/vibe-analysis/schemas/request.schema';
import { handleApiError, type ErrorResponse } from '@/shared/lib/errors';
import { getGrokApiKey } from '@/lib/env';
import { parseJsonSafely } from '@/lib/utils';
import { withBotProtection } from '@/lib/security/middleware/bot-protection';
import { withRateLimit } from '@/lib/security/middleware/rate-limit';
import type { VibeAnalysisResponse } from '@/features/vibe-analysis/types';

/**
 * POST handler with rate limiting and bot protection
 * Rate limiting runs first (cheap), then bot protection (expensive)
 * Analyzes vibe compatibility between two X users
 */
export const POST = withRateLimit(
  withBotProtection(
    async function handler(
      request: NextRequest
    ): Promise<NextResponse<VibeAnalysisResponse | ErrorResponse>> {
      try {
        // Get validated API key from centralized env management
        const apiKey = getGrokApiKey();

        // Parse and validate request body with size limits
        const body = await parseJsonSafely(request);
        const validatedData = vibeAnalysisRequestSchema.parse(body);

        // Initialize service and perform analysis
        const grokService = new GrokService(apiKey);
        const result = await grokService.analyzeVibe({
          userOne: validatedData.userOne,
          userTwo: validatedData.userTwo,
          analysisDepth: validatedData.analysisDepth || 'standard',
        });

        // Return successful result
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        // Delegate all error handling to the centralized handler
        return handleApiError(error);
      }
    },
    {
      enableLogging: true,
      blockMessage: 'Bot traffic detected. This endpoint is protected.',
    }
  ),
  {
    enableLogging: true,
    includeHeaders: true,
    errorMessage: 'Too many vibe analysis requests. Please wait before analyzing more users.',
  }
);

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      message: 'Vibe Compatibility API',
      version: '2.0.0',
      status: 'operational',
    },
    { status: 200 }
  );
}
