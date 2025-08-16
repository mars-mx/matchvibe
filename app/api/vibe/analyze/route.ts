import { NextRequest, NextResponse } from 'next/server';
import { GrokService } from '@/features/vibe-analysis/services/grok.service';
import { vibeAnalysisRequestSchema } from '@/features/vibe-analysis/schemas/request.schema';
import { handleApiError, ValidationError, type ErrorResponse } from '@/shared/lib/errors';
import { getGrokApiKey } from '@/lib/env';
import type { VibeAnalysisResponse } from '@/features/vibe-analysis/types';

/**
 * Safely parse JSON from request with size limits and validation
 * @param request - The Next.js request object
 * @returns Parsed JSON object
 */
async function parseJsonSafely(request: NextRequest): Promise<unknown> {
  const MAX_BODY_SIZE = 1024 * 10; // 10KB limit

  try {
    // Get the raw body first to check size
    const text = await request.text();

    // Check body size
    if (text.length > MAX_BODY_SIZE) {
      throw new ValidationError(`Request body too large. Maximum size is ${MAX_BODY_SIZE} bytes.`, {
        code: 'BODY_TOO_LARGE',
        field: 'body',
      });
    }

    // Check for empty body
    if (!text.trim()) {
      throw new ValidationError('Request body is empty', { code: 'EMPTY_BODY', field: 'body' });
    }

    // Parse JSON with additional safety
    const parsed = JSON.parse(text);

    // Basic type validation
    if (typeof parsed !== 'object' || parsed === null) {
      throw new ValidationError('Request body must be a valid JSON object', {
        code: 'INVALID_JSON_TYPE',
        field: 'body',
      });
    }

    return parsed;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON format in request body', {
        code: 'INVALID_JSON_SYNTAX',
        field: 'body',
      });
    }

    // Re-throw other errors
    throw error;
  }
}

export async function POST(
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
