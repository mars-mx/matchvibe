'use server';

import { GrokService } from '@/features/vibe-analysis/services/grok.service';
import { vibeAnalysisRequestSchema } from '@/features/vibe-analysis/schemas/request.schema';
import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';
import { getGrokApiKey } from '@/lib/env';
import { handleActionError } from '@/features/vibe-analysis/lib/handle-action-error';
import { z } from 'zod';

const formSchema = z.object({
  userOne: z.string().min(1, 'First username is required').max(50, 'Username too long'),
  userTwo: z.string().min(1, 'Second username is required').max(50, 'Username too long'),
  analysisDepth: z.enum(['quick', 'standard', 'deep']).default('standard'),
});

export type FormState = {
  success: boolean;
  message?: string;
  result?: VibeAnalysisResult;
  errors?: {
    userOne?: string[];
    userTwo?: string[];
    general?: string[];
  };
};

export async function analyzeVibeAction(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  try {
    const rawFormData = {
      userOne: formData.get('userOne')?.toString().replace('@', '') || '',
      userTwo: formData.get('userTwo')?.toString().replace('@', '') || '',
      analysisDepth: formData.get('analysisDepth')?.toString() || 'standard',
    };

    const validatedFields = formSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { userOne, userTwo, analysisDepth } = validatedFields.data;

    if (userOne.toLowerCase() === userTwo.toLowerCase()) {
      return {
        success: false,
        errors: {
          general: ['Please enter two different usernames'],
        },
      };
    }

    // Validate request data with schema
    const validatedData = vibeAnalysisRequestSchema.parse({
      userOne,
      userTwo,
      analysisDepth,
    });

    // Get validated API key from centralized env management
    const apiKey = getGrokApiKey();

    // Initialize service and perform analysis directly
    const grokService = new GrokService(apiKey);
    const result = await grokService.analyzeVibe({
      userOne: validatedData.userOne,
      userTwo: validatedData.userTwo,
      analysisDepth: validatedData.analysisDepth || 'standard',
    });

    return {
      success: true,
      result,
      message: 'Vibe analysis completed successfully!',
    };
  } catch (error: unknown) {
    // Delegate all error handling to the centralized handler
    return handleActionError(error);
  }
}
