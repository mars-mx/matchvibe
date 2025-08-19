/**
 * Shared types for vibe analysis scoring
 */

export interface DimensionComparison {
  dimension: string;
  user1Value: number | null;
  user2Value: number | null;
  difference: number;
  score: number;
  weight: number;
}
