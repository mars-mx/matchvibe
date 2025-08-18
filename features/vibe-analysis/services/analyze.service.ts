import { GrokService } from '@/features/vibe-analysis/services/grok/grok.service';
import { vibeAnalysisRequestSchema } from '@/features/vibe-analysis/schemas/request.schema';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';
import { getGrokApiKey } from '@/lib/env';

export async function analyzeVibeService(
  userOne: string,
  userTwo: string,
  analysisDepth: 'quick' | 'standard' | 'deep' = 'standard'
): Promise<VibeAnalysisResult> {
  try {
    // Remove @ symbol if present
    const cleanUserOne = userOne.replace('@', '');
    const cleanUserTwo = userTwo.replace('@', '');

    // Validate usernames are different
    if (cleanUserOne.toLowerCase() === cleanUserTwo.toLowerCase()) {
      throw new Error('Please enter two different usernames');
    }

    // Validate request data with schema
    const validatedData = vibeAnalysisRequestSchema.parse({
      userOne: cleanUserOne,
      userTwo: cleanUserTwo,
      analysisDepth,
    });

    // Get validated API key from centralized env management
    const apiKey = getGrokApiKey();

    // Initialize service and perform analysis
    const grokService = new GrokService(apiKey);
    const result = await grokService.analyzeVibe({
      userOne: validatedData.userOne,
      userTwo: validatedData.userTwo,
      analysisDepth: validatedData.analysisDepth || 'standard',
    });

    return result;
  } catch (error) {
    // For service layer, we want to throw the error
    // so the page can handle it appropriately
    console.error('Vibe analysis service error:', error);
    throw error;
  }
}
