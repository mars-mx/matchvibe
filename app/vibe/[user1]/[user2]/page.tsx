import { analyzeVibeService } from '@/features/vibe-analysis/services/analyze.service';
import { verifyBotId, shouldBlockRequest } from '@/lib/security/botid';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { VibeResultsWrapper } from '@/features/vibe-analysis/components/vibe-results-wrapper';
import { ValidationError } from '@/shared/lib/errors';

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

  // Clean usernames
  const cleanUser1 = user1.replace('@', '').trim();
  const cleanUser2 = user2.replace('@', '').trim();

  // Validate usernames
  if (!cleanUser1 || !cleanUser2) {
    notFound();
  }

  if (cleanUser1.toLowerCase() === cleanUser2.toLowerCase()) {
    throw new ValidationError('Please enter two different usernames', {
      field: 'usernames',
      value: { userOne: cleanUser1, userTwo: cleanUser2 },
    });
  }

  // Perform vibe analysis (cache is handled internally by the service)
  const result = await analyzeVibeService(cleanUser1, cleanUser2, 'standard');

  return <VibeResultsWrapper result={result} user1={cleanUser1} user2={cleanUser2} />;
}
