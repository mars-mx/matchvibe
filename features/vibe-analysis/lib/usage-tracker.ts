/**
 * Utility functions for tracking Grok API usage and calculating costs
 */

import { GROK_PRICING, LIVE_SEARCH_PRICING } from '../config/constants';
import type { GrokAPIResponse } from '../schemas';
import type { Logger } from 'pino';

/**
 * Calculate total tokens including reasoning tokens
 */
export function calculateTotalTokens(usage: GrokAPIResponse['usage']): {
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  totalTokens: number;
} {
  if (!usage) {
    return {
      promptTokens: 0,
      completionTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
    };
  }

  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens || 0;

  // Total includes prompt + completion + reasoning
  const totalTokens = promptTokens + completionTokens + reasoningTokens;

  return {
    promptTokens,
    completionTokens,
    reasoningTokens,
    totalTokens,
  };
}

/**
 * Calculate Live Search cost based on number of sources used
 */
export function calculateLiveSearchCost(sourcesUsed: number): number {
  return sourcesUsed * LIVE_SEARCH_PRICING.costPerSource;
}

/**
 * Calculate the cost of a Grok API call
 */
// Model name mapping for pricing lookup
const MODEL_PRICING_MAP: Record<string, keyof typeof GROK_PRICING> = {
  'grok-3-mini': 'grok-3-mini',
  'grok-3': 'grok-3',
  'grok-4': 'grok-4-0709',
  'grok-4-0709': 'grok-4-0709',
};

export function calculateGrokCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
  reasoningTokens: number,
  sourcesUsed: number = 0
): {
  inputCost: number;
  outputCost: number;
  searchCost: number;
  totalCost: number;
} {
  // Get pricing for the model using the map
  const pricingKey = MODEL_PRICING_MAP[model];
  const pricing = pricingKey
    ? GROK_PRICING[pricingKey]
    : (console.warn(`Unknown model "${model}", using grok-3-mini pricing`),
      GROK_PRICING['grok-3-mini']);

  // Calculate costs (pricing is per million tokens)
  const inputCost = (promptTokens / 1_000_000) * pricing.input;

  // Output cost includes both completion and reasoning tokens
  const outputCost = ((completionTokens + reasoningTokens) / 1_000_000) * pricing.output;

  // Live Search cost
  const searchCost = calculateLiveSearchCost(sourcesUsed);

  const totalCost = inputCost + outputCost + searchCost;

  return {
    inputCost,
    outputCost,
    searchCost,
    totalCost,
  };
}

/**
 * Track and log Grok API usage with cost calculation
 */
export function trackGrokUsage(
  model: string,
  usage: GrokAPIResponse['usage'],
  logger: Logger
): void {
  if (!usage) {
    return;
  }

  const tokens = calculateTotalTokens(usage);
  const sourcesUsed = usage.num_sources_used || 0;
  const costs = calculateGrokCost(
    model,
    tokens.promptTokens,
    tokens.completionTokens,
    tokens.reasoningTokens,
    sourcesUsed
  );

  logger.info(
    {
      model,
      sourcesUsed,
      tokens: {
        prompt: tokens.promptTokens,
        completion: tokens.completionTokens,
        reasoning: tokens.reasoningTokens,
        total: tokens.totalTokens,
      },
      costs: {
        input: `$${costs.inputCost.toFixed(6)}`,
        output: `$${costs.outputCost.toFixed(6)}`,
        search: `$${costs.searchCost.toFixed(6)}`,
        total: `$${costs.totalCost.toFixed(6)}`,
      },
    },
    `Grok API: ${sourcesUsed} sources | ${tokens.totalTokens} tokens | $${costs.totalCost.toFixed(6)}`
  );
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`;
  } else if (cost < 1) {
    return `$${cost.toFixed(4)}`;
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

/**
 * Calculate session totals for multiple API calls
 */
export interface SessionUsage {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  totalSources: number;
  breakdown: {
    promptTokens: number;
    completionTokens: number;
    reasoningTokens: number;
  };
  costBreakdown: {
    tokenCost: number;
    searchCost: number;
  };
}

export function createSessionTracker(): {
  track: (model: string, usage: GrokAPIResponse['usage']) => void;
  getSessionUsage: () => SessionUsage;
  logSessionSummary: (logger: Logger) => void;
} {
  const session: SessionUsage = {
    totalCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    totalSources: 0,
    breakdown: {
      promptTokens: 0,
      completionTokens: 0,
      reasoningTokens: 0,
    },
    costBreakdown: {
      tokenCost: 0,
      searchCost: 0,
    },
  };

  return {
    track: (model: string, usage: GrokAPIResponse['usage']) => {
      if (!usage) return;

      const tokens = calculateTotalTokens(usage);
      const sourcesUsed = usage.num_sources_used || 0;
      const costs = calculateGrokCost(
        model,
        tokens.promptTokens,
        tokens.completionTokens,
        tokens.reasoningTokens,
        sourcesUsed
      );

      session.totalCalls++;
      session.totalTokens += tokens.totalTokens;
      session.totalCost += costs.totalCost;
      session.totalSources += sourcesUsed;
      session.breakdown.promptTokens += tokens.promptTokens;
      session.breakdown.completionTokens += tokens.completionTokens;
      session.breakdown.reasoningTokens += tokens.reasoningTokens;
      session.costBreakdown.tokenCost += costs.inputCost + costs.outputCost;
      session.costBreakdown.searchCost += costs.searchCost;
    },

    getSessionUsage: () => session,

    logSessionSummary: (logger: Logger) => {
      logger.info(
        {
          calls: session.totalCalls,
          sources: session.totalSources,
          tokens: session.totalTokens,
          cost: formatCost(session.totalCost),
          breakdown: session.breakdown,
          costBreakdown: {
            tokens: formatCost(session.costBreakdown.tokenCost),
            search: formatCost(session.costBreakdown.searchCost),
            total: formatCost(session.totalCost),
          },
        },
        `Session totals: ${session.totalCalls} calls | ${session.totalSources} sources | ${session.totalTokens} tokens | ${formatCost(session.totalCost)}`
      );
    },
  };
}
