import { analyzeVibeService } from '@/features/vibe-analysis/services/analyze.service';
import { verifyBotId, shouldBlockRequest } from '@/lib/security/botid';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { VibeResultsWrapper } from '@/features/vibe-analysis/components/vibe-results-wrapper';

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

  // Fetch vibe analysis data (this happens on the server)
  const result = await analyzeVibeService(user1, user2, 'standard');

  return <VibeResultsWrapper result={result} user1={user1} user2={user2} />;
}
