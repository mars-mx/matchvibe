import type { VibeAnalysisResult } from '@/features/vibe-analysis/types';
import {
  COMPATIBILITY_LEVELS,
  SHARE_CONFIG,
  type CompatibilityLevel,
} from '../config/vibe-constants';
import { TIME_THRESHOLDS } from '@/lib/config/constants';

export function getCompatibilityLevel(score: number): {
  level: CompatibilityLevel;
  label: string;
  color: string;
} {
  // Find the appropriate level based on score thresholds
  const levels = Object.entries(COMPATIBILITY_LEVELS).sort(
    ([, a], [, b]) => b.minScore - a.minScore
  );

  for (const [level, config] of levels) {
    if (score >= config.minScore) {
      return {
        level: level as CompatibilityLevel,
        label: config.label,
        color: config.color,
      };
    }
  }

  // Default to low compatibility
  return {
    level: 'low',
    label: COMPATIBILITY_LEVELS.low.label,
    color: COMPATIBILITY_LEVELS.low.color,
  };
}

export function formatVibeScore(score: number): string {
  return `${Math.round(score)}/100`;
}

export function generateShareText(result: VibeAnalysisResult): string {
  const { score, metadata } = result;
  const compatibility = getCompatibilityLevel(score);

  return SHARE_CONFIG.SHARE_TEXT_TEMPLATE.replace('{user1}', metadata.userOne)
    .replace('{user2}', metadata.userTwo)
    .replace('{score}', score.toString())
    .replace('{level}', compatibility.label);
}

export function generateShareUrl(result: VibeAnalysisResult): string {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'https://matchvibe.app';

  return `${baseUrl}/vibe/${result.metadata.userOne}/${result.metadata.userTwo}`;
}

export function calculateAnalysisDuration(timestamp: string): string {
  const start = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / TIME_THRESHOLDS.MINUTE);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMs / TIME_THRESHOLDS.HOUR);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffMs / TIME_THRESHOLDS.DAY);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
