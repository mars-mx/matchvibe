import { analyzeVibeService } from '@/features/vibe-analysis/services/analyze.service';
import { verifyBotId, shouldBlockRequest } from '@/lib/security/botid';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { VibeResultsWrapper } from '@/features/vibe-analysis/components/vibe-results-wrapper';
import {
  createMatchupAction,
  updateMatchupStatusAction,
  saveVibeResultAction,
  getExistingResultAction,
} from '@/lib/actions/convex.actions';
import {
  generateSessionId,
  validateMatchupUsers,
  mapConvexSchemaToVibeResult,
} from '@/lib/utils/convex.utils';

interface PageProps {
  params: Promise<{
    user1: string;
    user2: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { user1, user2 } = await params;

  return {
    title: `Vibe Analysis: @${user1} × @${user2} | Match Vibe`,
    description: `AI-powered vibe compatibility analysis between @${user1} and @${user2}`,
  };
}

export default async function VibePage({ params }: PageProps) {
  const { user1, user2 } = await params;

  // Bot protection check (only in production)
  if (process.env.NODE_ENV === 'production') {
    const botResult = await verifyBotId();
    if (shouldBlockRequest(botResult)) {
      notFound(); // Return 404 for bot traffic
    }
  }

  // Validate usernames
  try {
    validateMatchupUsers(user1, user2);
  } catch {
    notFound(); // Return 404 for invalid username combinations
  }

  // Clean usernames
  const cleanUser1 = user1.replace('@', '');
  const cleanUser2 = user2.replace('@', '');

  // Generate session ID for this matchup
  const sessionId = generateSessionId();

  let result;
  let matchupId;

  try {
    // Check if result already exists (optional caching)
    const existingResult = await getExistingResultAction(cleanUser1, cleanUser2);

    if (existingResult) {
      // Use existing result if found
      result = mapConvexSchemaToVibeResult(existingResult);
    } else {
      // Create new matchup record with 'analyzing' status
      matchupId = await createMatchupAction(sessionId, cleanUser1, cleanUser2);

      // Perform vibe analysis
      result = await analyzeVibeService(cleanUser1, cleanUser2, 'standard');

      // Save analysis results to Convex
      const resultId = await saveVibeResultAction(result, cleanUser1, cleanUser2);

      // Update matchup status to 'completed'
      await updateMatchupStatusAction(sessionId, 'completed', resultId);
    }
  } catch (error) {
    console.error('Vibe analysis error:', error);

    // Update matchup status to 'error' if matchup was created
    if (matchupId) {
      try {
        await updateMatchupStatusAction(
          sessionId,
          'error',
          undefined,
          error instanceof Error ? error.message : 'Analysis failed'
        );
      } catch (updateError) {
        console.error('Failed to update matchup status:', updateError);
      }
    }

    // Re-throw the error to be handled by error boundary
    throw error;
  }

  return <VibeResultsWrapper result={result} user1={cleanUser1} user2={cleanUser2} />;
}
