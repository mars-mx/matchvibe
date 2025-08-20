import { NextRequest, NextResponse } from 'next/server';
import { analyzeVibeService } from '@/features/vibe-analysis/services/analyze.service';
import { vibeAnalysisRequestSchema } from '@/features/vibe-analysis/schemas/request.schema';
import { ValidationError } from '@/shared/lib/errors/specific.errors';
import { z } from 'zod';

// Remove explicit runtime setting - let Vercel auto-detect
export const maxDuration = 300; // 300 seconds (5 minutes) - Vercel Pro plan with Fluid Compute

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request with Zod schema
    const validatedData = vibeAnalysisRequestSchema.parse(body);

    // Call the service - it handles all caching internally via Convex
    const result = await analyzeVibeService(
      validatedData.userOne,
      validatedData.userTwo,
      validatedData.analysisDepth || 'standard'
    );

    // Return successful response
    return NextResponse.json(result);
  } catch (error) {
    console.error('Vibe analysis API error:', error);

    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.metadata,
        },
        { status: 400 }
      );
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Failed to analyze vibe compatibility',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Support preflight requests
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
