export { vibeAnalysisRequestSchema } from './request.schema';

export {
  vibeAnalysisResultSchema,
  vibeAnalysisErrorSchema,
  grokAPIResponseSchema,
  type VibeAnalysisResult,
  type VibeAnalysisError,
  type GrokAPIResponse,
} from './response.schema';

import { z } from 'zod';
import { vibeAnalysisRequestSchema } from './request.schema';
import { vibeAnalysisResultSchema } from './response.schema';

export type VibeAnalysisRequest = z.infer<typeof vibeAnalysisRequestSchema>;
export type VibeAnalysisResponse = z.infer<typeof vibeAnalysisResultSchema>;
