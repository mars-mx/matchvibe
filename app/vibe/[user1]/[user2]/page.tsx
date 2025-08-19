import { Metadata } from 'next';
import { VibeAnalysisPage } from '@/features/vibe-analysis/components/vibe-analysis-page';

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

  // Clean usernames
  const cleanUser1 = user1.replace('@', '').trim();
  const cleanUser2 = user2.replace('@', '').trim();

  // Pass cleaned usernames to the client component
  return <VibeAnalysisPage user1={cleanUser1} user2={cleanUser2} />;
}
