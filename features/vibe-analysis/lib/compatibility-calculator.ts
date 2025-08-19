/**
 * Compatibility Calculator
 * Calculates final compatibility score from 15 personality dimensions
 */

import type { UserProfile } from '../schemas/profile.schema';
import { getVibeAmplificationPower } from '@/lib/env';
import type { DimensionComparison } from './types';
import {
  powerMean,
  geometricMean,
  choquetInspired,
  waspas,
  penaltyBased,
  sigmoidTransform,
} from './advanced-scoring';

interface DimensionWeight {
  weight: number;
  isComplementary?: boolean; // If true, difference is good; if false, similarity is good
}

/**
 * Dimension weights and configuration
 * Higher weights = more important for compatibility
 */
const DIMENSION_CONFIG: Record<string, DimensionWeight> = {
  // Emotional & Mood - similarity preferred
  positivityRating: { weight: 0.8 },
  empathyRating: { weight: 0.6 },

  // Interaction Style - mixed
  engagementRating: { weight: 0.7 },
  debateRating: { weight: 0.5, isComplementary: true }, // One debater + one listener can work

  // Content Style - strong similarity preferred
  shitpostRating: { weight: 0.9 }, // Very important to match
  memeRating: { weight: 0.8 },
  intellectualRating: { weight: 1.0 }, // Most important - intellectual mismatch is problematic

  // Topic Focus - moderate importance
  politicalRating: { weight: 0.7 }, // Political differences can be divisive
  personalSharingRating: { weight: 0.4, isComplementary: true }, // One sharer + one listener works
  inspirationalQuotesRating: { weight: 0.3 }, // Low importance

  // Social Energy - complementary can work
  extroversionRating: { weight: 0.5, isComplementary: true }, // Opposites can balance
  authenticityRating: { weight: 0.8 }, // Both should be similarly authentic

  // Values - important
  optimismRating: { weight: 0.7 }, // Mismatched optimism causes friction

  // Communication - very important
  humorRating: { weight: 0.9 }, // Humor compatibility is crucial
  aiGeneratedRating: { weight: 0.2 }, // Low importance unless both are bots
};

export class CompatibilityCalculator {
  private readonly amplificationPower: number;

  constructor() {
    // Get amplification power from environment (default 2.5)
    try {
      this.amplificationPower = getVibeAmplificationPower();
    } catch {
      // Fallback to default if env not available (e.g., during build)
      this.amplificationPower = 2.5;
    }
  }

  /**
   * Calculate compatibility score between two user profiles
   */
  calculateScore(
    profile1: UserProfile,
    profile2: UserProfile
  ): {
    score: number;
    breakdown: DimensionComparison[];
    categoryScores: Record<string, number>;
  } {
    const comparisons: DimensionComparison[] = [];

    // Compare each dimension
    const dimensions = [
      'positivityRating',
      'empathyRating',
      'engagementRating',
      'debateRating',
      'shitpostRating',
      'memeRating',
      'intellectualRating',
      'politicalRating',
      'personalSharingRating',
      'inspirationalQuotesRating',
      'extroversionRating',
      'authenticityRating',
      'optimismRating',
      'humorRating',
      'aiGeneratedRating',
    ] as const;

    for (const dimension of dimensions) {
      const config = DIMENSION_CONFIG[dimension];
      const value1 = profile1.contentStyle[dimension];
      const value2 = profile2.contentStyle[dimension];

      // Skip if either value is null
      if (value1 === null || value2 === null) {
        continue;
      }

      const difference = Math.abs(value1 - value2);
      let dimensionScore: number;

      if (config.isComplementary) {
        // For complementary dimensions, moderate difference is good
        // Peak compatibility at 0.5 difference
        if (difference <= 0.5) {
          dimensionScore = difference * 2; // 0->0, 0.5->1
        } else {
          dimensionScore = 2 - difference * 2; // 0.5->1, 1->0
        }
      } else {
        // For similarity dimensions, smaller difference is better
        dimensionScore = 1 - difference;
      }

      // Apply special rules
      dimensionScore = this.applySpecialRules(dimension, value1, value2, dimensionScore);

      comparisons.push({
        dimension,
        user1Value: value1,
        user2Value: value2,
        difference,
        score: dimensionScore,
        weight: config.weight,
      });
    }

    // Calculate raw score using advanced methods
    const rawScore = this.calculateCombinedScore(comparisons);

    // Apply amplification to spread scores across full range
    const amplifiedScore = this.amplifyScore(rawScore);

    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(comparisons);

    return {
      score: Math.max(0, Math.min(100, Math.round(amplifiedScore * 100))), // Ensure 0-100 range
      breakdown: comparisons,
      categoryScores,
    };
  }

  /**
   * Calculate combined score using a balanced approach
   * Combines multiple methods to create meaningful differentiation
   */
  private calculateCombinedScore(comparisons: DimensionComparison[]): number {
    if (comparisons.length === 0) return 0.5;

    const scores = comparisons.map((c) => c.score);
    const weights = comparisons.map((c) => c.weight);

    // Calculate basic statistics
    const minScore = Math.min(...scores);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const weightedAvg =
      comparisons.reduce((sum, c) => sum + c.score * c.weight, 0) /
      comparisons.reduce((sum, c) => sum + c.weight, 0);

    // Calculate various aggregation methods
    const methods = {
      // Standard weighted average (baseline)
      weighted: weightedAvg,

      // Geometric mean (penalizes low scores moderately)
      geometric: geometricMean(scores, weights),

      // Power mean with p=2 (quadratic - emphasizes high scores)
      quadratic: powerMean(scores, weights, 2),

      // Power mean with p=0.5 (between arithmetic and quadratic)
      powerHalf: powerMean(scores, weights, 0.5),

      // WASPAS balanced approach
      waspas: waspas(scores, weights, 0.7), // 70% sum, 30% product for balance

      // Choquet integral for synergies
      choquet: choquetInspired(comparisons, this.getInteractionMatrix()),

      // Penalty-based for bad matches
      penalty: penaltyBased(comparisons, 0.3, 0.4),
    };

    // Identify critical dimensions and their performance
    const criticalDimensions = [
      'intellectualRating',
      'humorRating',
      'authenticityRating',
      'shitpostRating',
    ];
    const criticalScores = comparisons
      .filter((c) => criticalDimensions.includes(c.dimension))
      .map((c) => c.score);
    const minCritical = criticalScores.length > 0 ? Math.min(...criticalScores) : 1;
    const avgCritical =
      criticalScores.length > 0
        ? criticalScores.reduce((sum, s) => sum + s, 0) / criticalScores.length
        : 1;

    let finalScore: number;

    // Choose aggregation strategy based on score patterns
    if (minCritical < 0.25) {
      // Critical failure: apply heavy penalties
      finalScore = Math.min(methods.geometric * 0.8, methods.penalty, weightedAvg * 0.7);
    } else if (avgScore > 0.85 && minScore > 0.6) {
      // Excellent match: use optimistic aggregation
      finalScore =
        0.4 * methods.quadratic +
        0.3 * methods.waspas +
        0.2 * methods.choquet +
        0.1 * methods.weighted;
    } else if (avgScore > 0.7) {
      // Good match: balanced approach
      finalScore =
        0.3 * methods.weighted +
        0.25 * methods.geometric +
        0.25 * methods.waspas +
        0.2 * methods.choquet;
    } else if (minScore < 0.3) {
      // Poor dimensions present: penalize appropriately
      finalScore = 0.4 * methods.penalty + 0.3 * methods.geometric + 0.3 * methods.weighted;
    } else {
      // Mixed compatibility: use balanced methods
      finalScore =
        0.35 * methods.weighted +
        0.25 * methods.powerHalf +
        0.25 * methods.waspas +
        0.15 * methods.choquet;
    }

    // Apply critical dimension modifier
    if (avgCritical < 0.5) {
      finalScore *= 0.5 + avgCritical; // Scale down based on critical performance
    }

    // Ensure minimum differentiation from pure average
    // This prevents the score from being too close to the simple average
    const diff = Math.abs(finalScore - weightedAvg);
    if (diff < 0.05 && minScore < 0.5) {
      // If too close to average and has poor dimensions, reduce more
      finalScore = weightedAvg - 0.1;
    }

    // Ensure score is in valid range
    return Math.max(0, Math.min(1, finalScore));
  }

  /**
   * Generate interaction matrix for Choquet integral
   * Defines synergies and redundancies between dimensions
   */
  private getInteractionMatrix(): Record<string, Record<string, number>> {
    return {
      // Humor and shitposting have positive synergy
      humorRating: { shitpostRating: 0.15, memeRating: 0.1 },
      shitpostRating: { humorRating: 0.15, memeRating: 0.2 },
      memeRating: { shitpostRating: 0.2, humorRating: 0.1 },

      // Intellectual and debate have synergy
      intellectualRating: { debateRating: 0.1 },
      debateRating: { intellectualRating: 0.1 },

      // Authenticity enhances other dimensions
      authenticityRating: {
        empathyRating: 0.1,
        personalSharingRating: 0.15,
        aiGeneratedRating: -0.2, // Negative interaction with AI-generated
      },

      // Political and debate can clash (negative interaction)
      politicalRating: { debateRating: -0.05 },

      // AI-generated has negative interaction with authenticity
      aiGeneratedRating: { authenticityRating: -0.2 },
    };
  }

  /**
   * Amplify score to create meaningful spread across 0-100 range
   */
  private amplifyScore(rawScore: number): number {
    // Use a gentler sigmoid transformation
    const steepness = this.amplificationPower * 2; // Reduced from 3
    const transformed = sigmoidTransform(rawScore, steepness, 0.5);

    // Map to intuitive score ranges
    if (transformed > 0.85) {
      // Excellent compatibility: 88-95 range
      return 0.88 + (transformed - 0.85) * 0.47;
    } else if (transformed > 0.75) {
      // Very good compatibility: 78-88 range
      return 0.78 + (transformed - 0.75) * 1.0;
    } else if (transformed > 0.6) {
      // Good compatibility: 65-78 range
      return 0.65 + (transformed - 0.6) * 0.87;
    } else if (transformed > 0.4) {
      // Mixed compatibility: 45-65 range
      return 0.45 + (transformed - 0.4) * 1.0;
    } else if (transformed > 0.25) {
      // Poor compatibility: 25-45 range
      return 0.25 + (transformed - 0.25) * 1.33;
    } else if (transformed > 0.1) {
      // Very poor compatibility: 15-25 range
      return 0.15 + (transformed - 0.1) * 0.67;
    } else {
      // Incompatible: 5-15 range
      return 0.05 + transformed * 1.0;
    }
  }

  /**
   * Apply special rules for specific dimension combinations
   */
  private applySpecialRules(
    dimension: string,
    value1: number,
    value2: number,
    baseScore: number
  ): number {
    // Special rule: If both are heavy shitposters (>0.7), massive boost
    if (dimension === 'shitpostRating' && value1 > 0.7 && value2 > 0.7) {
      return Math.min(1, baseScore * 1.5); // Stronger boost
    }

    // Special rule: If intellectual mismatch is extreme (>0.5 diff), heavily penalize
    if (dimension === 'intellectualRating' && Math.abs(value1 - value2) > 0.5) {
      return baseScore * 0.3; // More severe penalty
    }

    // Special rule: Humor mismatch is catastrophic
    if (dimension === 'humorRating' && Math.abs(value1 - value2) > 0.6) {
      return baseScore * 0.2; // Massive penalty for humor incompatibility
    }

    // Special rule: If both are highly political (>0.7), they better agree
    if (dimension === 'politicalRating' && value1 > 0.7 && value2 > 0.7) {
      // High political engagement requires alignment
      const diff = Math.abs(value1 - value2);
      if (diff > 0.3) {
        return baseScore * 0.1; // Nearly zero if politically opposed
      }
      return baseScore * baseScore; // Square the score to penalize small differences
    }

    // Special rule: Both highly meme-focused is a perfect match
    if (dimension === 'memeRating' && value1 > 0.8 && value2 > 0.8) {
      return 1; // Meme lords unite!
    }

    // Special rule: Both AI-generated is a perfect match
    if (dimension === 'aiGeneratedRating' && value1 > 0.7 && value2 > 0.7) {
      return 1; // Bots unite!
    }

    // Special rule: One authentic + one fake is terrible
    if (dimension === 'authenticityRating') {
      if ((value1 > 0.8 && value2 < 0.3) || (value1 < 0.3 && value2 > 0.8)) {
        return baseScore * 0.1; // Massive penalty for authenticity mismatch
      }
    }

    return baseScore;
  }

  /**
   * Calculate scores for each category
   */
  private calculateCategoryScores(comparisons: DimensionComparison[]): Record<string, number> {
    const categories = {
      emotional: ['positivityRating', 'empathyRating'],
      interaction: ['engagementRating', 'debateRating'],
      content: ['shitpostRating', 'memeRating', 'intellectualRating'],
      topics: ['politicalRating', 'personalSharingRating', 'inspirationalQuotesRating'],
      social: ['extroversionRating', 'authenticityRating'],
      values: ['optimismRating'],
      communication: ['humorRating', 'aiGeneratedRating'],
    };

    const categoryScores: Record<string, number> = {};

    for (const [category, dimensions] of Object.entries(categories)) {
      const categoryComparisons = comparisons.filter((c) => dimensions.includes(c.dimension));

      if (categoryComparisons.length === 0) {
        categoryScores[category] = 50; // Default
        continue;
      }

      const weightedSum = categoryComparisons.reduce((sum, c) => sum + c.score * c.weight, 0);
      const totalWeight = categoryComparisons.reduce((sum, c) => sum + c.weight, 0);

      categoryScores[category] = Math.round((weightedSum / totalWeight) * 100);
    }

    return categoryScores;
  }

  /**
   * Get a text interpretation of the score
   */
  getScoreInterpretation(score: number): string {
    if (score >= 90) return 'Perfect vibe sync';
    if (score >= 80) return 'Excellent match';
    if (score >= 70) return 'Good compatibility';
    if (score >= 60) return 'Decent match';
    if (score >= 50) return 'Mixed compatibility';
    if (score >= 40) return 'Challenging match';
    if (score >= 20) return 'Poor compatibility';
    return 'Incompatible vibes';
  }

  /**
   * Identify the top matching and clashing dimensions
   */
  getTopMatches(
    breakdown: DimensionComparison[],
    count: number = 3
  ): {
    topMatches: DimensionComparison[];
    topClashes: DimensionComparison[];
  } {
    const sorted = [...breakdown].sort((a, b) => b.score - a.score);

    return {
      topMatches: sorted.slice(0, count),
      topClashes: sorted.slice(-count).reverse(),
    };
  }
}

// Export singleton instance
export const compatibilityCalculator = new CompatibilityCalculator();
