import { NextRequest, NextResponse } from 'next/server';
import { GrokService } from '@/features/vibe-analysis/services/grok.service';
import { vibeAnalysisRequestSchema } from '@/features/vibe-analysis/schemas/request.schema';
import { handleApiError, ConfigError, type ErrorResponse } from '@/shared/lib/errors';
import type { VibeAnalysisResponse } from '@/features/vibe-analysis/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<VibeAnalysisResponse | ErrorResponse>> {
  try {
    // Validate API key configuration
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      throw new ConfigError('API service is not configured. Please contact support.');
    }

    // Parse and validate request body
    const body = await request.json();
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
}

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
