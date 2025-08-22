/**
 * Advanced Scoring Methods for Multi-dimensional Compatibility
 *
 * Implements various non-averaging aggregation methods that preserve
 * the effects of individual dimensions instead of canceling them out.
 */

import type { DimensionComparison } from './types';

/**
 * Power Mean (Generalized Mean)
 * When p = -1: Harmonic mean (penalizes low scores heavily)
 * When p = 0: Geometric mean (multiplicative, no compensation)
 * When p = 1: Arithmetic mean (standard average)
 * When p = 2: Quadratic mean (emphasizes high scores)
 * When p → ∞: Maximum value
 * When p → -∞: Minimum value
 */
export function powerMean(scores: number[], weights: number[], p: number): number {
  if (scores.length === 0) return 0;

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  // Handle special cases
  if (p === 0) {
    // Geometric mean
    return geometricMean(scores, weights);
  }

  if (!isFinite(p)) {
    // p → ∞ gives maximum, p → -∞ gives minimum
    return p > 0 ? Math.max(...scores) : Math.min(...scores);
  }

  // General power mean formula
  let sum = 0;
  for (let i = 0; i < scores.length; i++) {
    const score = Math.max(0.001, scores[i]); // Avoid division by zero
    sum += weights[i] * Math.pow(score, p);
  }

  return Math.pow(sum / totalWeight, 1 / p);
}

/**
 * Weighted Geometric Mean
 * Multiplicative aggregation - one zero makes the result zero
 * No compensation between criteria
 */
export function geometricMean(scores: number[], weights: number[]): number {
  if (scores.length === 0) return 0;

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  let product = 1;
  for (let i = 0; i < scores.length; i++) {
    const score = Math.max(0.001, scores[i]); // Avoid log(0)
    product *= Math.pow(score, weights[i] / totalWeight);
  }

  return product;
}

/**
 * Weighted Harmonic Mean
 * Heavily penalizes low scores
 * Good for situations where all dimensions must be reasonably good
 */
export function harmonicMean(scores: number[], weights: number[]): number {
  if (scores.length === 0) return 0;

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  let sum = 0;
  for (let i = 0; i < scores.length; i++) {
    const score = Math.max(0.001, scores[i]); // Avoid division by zero
    sum += weights[i] / score;
  }

  return totalWeight / sum;
}

/**
 * Choquet Integral-inspired Aggregation
 * Considers interactions between criteria
 * Can model synergies and redundancies
 */
export function choquetInspired(
  comparisons: DimensionComparison[],
  interactionMatrix?: Record<string, Record<string, number>>
): number {
  if (comparisons.length === 0) return 0;

  // Sort comparisons by score (ascending)
  const sorted = [...comparisons].sort((a, b) => a.score - b.score);

  let result = 0;
  let previousScore = 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const scoreDiff = current.score - previousScore;

    // Calculate coalition weight (all dimensions from i to end)
    let coalitionWeight = 0;
    for (let j = i; j < sorted.length; j++) {
      coalitionWeight += sorted[j].weight;

      // Add interaction bonuses if provided
      if (interactionMatrix && i !== j) {
        const interaction = interactionMatrix[current.dimension]?.[sorted[j].dimension] || 0;
        coalitionWeight += interaction;
      }
    }

    result += scoreDiff * coalitionWeight;
    previousScore = current.score;
  }

  // Normalize by total weight
  const totalWeight = comparisons.reduce((sum, c) => sum + c.weight, 0);
  return result / totalWeight;
}

/**
 * ELECTRE-inspired Outranking Score
 * Based on concordance and discordance indices
 * Non-compensatory: bad performance can't be offset by good performance
 */
export function outranking(
  comparisons: DimensionComparison[],
  vetoThreshold: number = 0.3
): number {
  if (comparisons.length === 0) return 0;

  const totalWeight = comparisons.reduce((sum, c) => sum + c.weight, 0);

  // Calculate concordance (weighted sum of acceptable scores)
  let concordance = 0;
  let hasVeto = false;

  for (const comp of comparisons) {
    // Check for veto condition (any dimension below threshold)
    if (comp.score < vetoThreshold) {
      hasVeto = true;
      // Apply severe penalty for veto
      concordance += comp.weight * comp.score * 0.1;
    } else {
      concordance += comp.weight * comp.score;
    }
  }

  concordance /= totalWeight;

  // Calculate discordance (how much the worst dimensions oppose)
  const minScore = Math.min(...comparisons.map((c) => c.score));
  const discordance = 1 - minScore;

  // Final outranking score
  // If veto condition is met, cap the score
  if (hasVeto) {
    return Math.min(0.4, concordance * (1 - discordance));
  }

  return concordance * (1 - discordance * 0.5);
}

/**
 * Copula-based Aggregation using Frank Copula
 * Models dependencies between dimensions
 * Parameter theta controls dependency strength
 */
export function frankCopula(scores: number[], weights: number[], theta: number = 5): number {
  if (scores.length === 0) return 0;

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  // Transform scores to uniform [0,1] if needed
  const u = scores.map((s) => Math.max(0.001, Math.min(0.999, s)));

  // Frank copula formula for multivariate case
  let product = 1;
  for (let i = 0; i < u.length; i++) {
    const term = (Math.exp(-theta * u[i]) - 1) / (Math.exp(-theta) - 1);
    product *= Math.pow(1 + term, weights[i] / totalWeight);
  }

  // Apply inverse transformation
  const result = -Math.log(product) / theta;
  return Math.max(0, Math.min(1, result));
}

/**
 * Ordered Weighted Averaging (OWA)
 * Weights are applied to ordered positions, not specific criteria
 * Can model optimistic/pessimistic attitudes
 */
export function orderedWeightedAverage(scores: number[], positionWeights?: number[]): number {
  if (scores.length === 0) return 0;

  // Default: balanced weights
  const weights = positionWeights || scores.map(() => 1 / scores.length);

  // Sort scores in descending order
  const sorted = [...scores].sort((a, b) => b - a);

  let sum = 0;
  let totalWeight = 0;
  for (let i = 0; i < sorted.length; i++) {
    sum += sorted[i] * weights[i];
    totalWeight += weights[i];
  }

  return totalWeight > 0 ? sum / totalWeight : 0;
}

/**
 * Logarithmic Mean
 * Intermediate between geometric and arithmetic means
 */
export function logarithmicMean(scores: number[], weights: number[]): number {
  if (scores.length === 0) return 0;

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  let sum = 0;
  for (let i = 0; i < scores.length; i++) {
    const score = Math.max(0.001, scores[i]);
    // Use L(a,b) = (b-a)/ln(b/a) for pairs, generalized
    sum += (weights[i] * score) / Math.log(score + 1);
  }

  return sum / totalWeight;
}

/**
 * WASPAS-inspired Method
 * Weighted Aggregated Sum Product Assessment
 * Combines WSM and WPM with a balance parameter
 */
export function waspas(
  scores: number[],
  weights: number[],
  lambda: number = 0.5 // Balance between sum (1) and product (0)
): number {
  // Weighted Sum Model component
  const wsm =
    scores.reduce((sum, score, i) => sum + score * weights[i], 0) /
    weights.reduce((sum, w) => sum + w, 0);

  // Weighted Product Model component
  const wpm = geometricMean(scores, weights);

  // Combine with lambda parameter
  return lambda * wsm + (1 - lambda) * wpm;
}

/**
 * Sigmoid Transformation
 * Applies non-linear transformation to emphasize extremes
 */
export function sigmoidTransform(
  score: number,
  steepness: number = 10,
  midpoint: number = 0.5
): number {
  return 1 / (1 + Math.exp(-steepness * (score - midpoint)));
}

/**
 * Penalty-based Aggregation
 * Applies multiplicative penalties for poor performance
 */
export function penaltyBased(
  comparisons: DimensionComparison[],
  penaltyThreshold: number = 0.4,
  penaltyFactor: number = 0.5
): number {
  if (comparisons.length === 0) return 0;

  // Start with weighted average
  const totalWeight = comparisons.reduce((sum, c) => sum + c.weight, 0);
  let baseScore = comparisons.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight;

  // Apply penalties for poor dimensions
  for (const comp of comparisons) {
    if (comp.score < penaltyThreshold) {
      const penaltyStrength = (penaltyThreshold - comp.score) / penaltyThreshold;
      const penalty = 1 - (penaltyStrength * penaltyFactor * comp.weight) / totalWeight;
      baseScore *= penalty;
    }
  }

  return Math.max(0, baseScore);
}

/**
 * T-norm based aggregation (fuzzy logic)
 * Various t-norms for intersection of fuzzy sets
 */
export const TNorms = {
  // Minimum (Gödel t-norm) - most restrictive
  minimum: (scores: number[]): number => Math.min(...scores),

  // Product (algebraic t-norm)
  product: (scores: number[]): number => scores.reduce((prod, s) => prod * s, 1),

  // Lukasiewicz t-norm
  lukasiewicz: (scores: number[]): number => {
    const sum = scores.reduce((s, score) => s + score, 0);
    return Math.max(0, sum - scores.length + 1);
  },

  // Hamacher product
  hamacher: (scores: number[], gamma: number = 2): number => {
    if (scores.length === 0) return 0;
    return scores.reduce((result, score) => {
      if (gamma === 0) {
        return (result * score) / (result + score - result * score);
      }
      return (result * score) / (gamma + (1 - gamma) * (result + score - result * score));
    });
  },

  // Einstein product
  einstein: (scores: number[]): number => {
    if (scores.length === 0) return 0;
    return scores.reduce((result, score) => {
      return (result * score) / (2 - (result + score - result * score));
    });
  },
};

/**
 * T-conorm based aggregation (fuzzy logic)
 * Various t-conorms for union of fuzzy sets
 */
export const TConorms = {
  // Maximum (Gödel t-conorm) - most permissive
  maximum: (scores: number[]): number => Math.max(...scores),

  // Probabilistic sum
  probabilistic: (scores: number[]): number => {
    if (scores.length === 0) return 0;
    return scores.reduce((result, score) => result + score - result * score);
  },

  // Lukasiewicz t-conorm
  lukasiewicz: (scores: number[]): number => {
    const sum = scores.reduce((s, score) => s + score, 0);
    return Math.min(1, sum);
  },

  // Einstein sum
  einstein: (scores: number[]): number => {
    if (scores.length === 0) return 0;
    return scores.reduce((result, score) => {
      return (result + score) / (1 + result * score);
    });
  },
};

/**
 * Hybrid Multi-Method Aggregator
 * Combines multiple methods based on score distribution
 */
export function hybridAggregator(
  comparisons: DimensionComparison[],
  config?: {
    useChoquet?: boolean;
    useOutranking?: boolean;
    usePenalty?: boolean;
    powerMeanP?: number;
  }
): number {
  const scores = comparisons.map((c) => c.score);
  const weights = comparisons.map((c) => c.weight);

  // Calculate score statistics
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore;

  // Base score using power mean
  const p = config?.powerMeanP ?? (range > 0.5 ? -0.5 : 0.5);
  let finalScore = powerMean(scores, weights, p);

  // Apply Choquet if enabled and there are interactions
  if (config?.useChoquet) {
    const choquetScore = choquetInspired(comparisons);
    finalScore = 0.6 * finalScore + 0.4 * choquetScore;
  }

  // Apply outranking if there are critical failures
  if (config?.useOutranking && minScore < 0.3) {
    const outrankingScore = outranking(comparisons);
    finalScore = Math.min(finalScore, outrankingScore);
  }

  // Apply penalty-based adjustment
  if (config?.usePenalty) {
    finalScore = penaltyBased(
      [
        ...comparisons.map((c) => ({
          ...c,
          score: finalScore,
        })),
      ],
      0.4,
      0.5
    );
  }

  // Apply sigmoid transformation for more extreme scores
  return sigmoidTransform(finalScore, 8, 0.5);
}
