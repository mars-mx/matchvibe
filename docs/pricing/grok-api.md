# Grok API Pricing Guide

## Overview

MatchVibe uses the Grok API for analyzing X (Twitter) user compatibility. This document details all associated costs and optimization strategies.

## Pricing Components

### 1. Token-Based Pricing

Grok uses a per-token pricing model similar to other LLMs. Costs vary by model:

| Model           | Input Tokens | Output Tokens | Use Case                        |
| --------------- | ------------ | ------------- | ------------------------------- |
| **Grok-4**      | $3.00/1M     | $15.00/1M     | Complex analysis, vibe matching |
| **Grok-3**      | $3.00/1M     | $15.00/1M     | General purpose tasks           |
| **Grok-3-mini** | $0.30/1M     | $0.50/1M      | Profile fetching, simple tasks  |

### 2. Live Search Pricing

When using Grok's Live Search capabilities to fetch real-time data from X:

- **Cost**: $25 per 1,000 sources used ($0.025 per source)
- **Tracking**: Available in `response.usage.num_sources_used`
- **Note**: Each search query can use multiple sources

## MatchVibe's Two-Stage Architecture

To optimize costs, MatchVibe uses a two-stage approach:

### Stage 1: Profile Fetching (Grok-3-mini)

- **Purpose**: Fetch user profiles from X
- **Model**: Grok-3-mini (90% cheaper than Grok-4)
- **Search**: ENABLED - Required to fetch real X data
- **Typical Cost**: ~$0.001 tokens + ~$0.75 search (30 sources × $0.025)

### Stage 2: Vibe Matching (Grok-3-mini)

- **Purpose**: Analyze compatibility between profiles
- **Model**: Grok-3-mini (balanced cost/performance)
- **Search**: DISABLED - Works from fetched data
- **Typical Cost**: ~$0.002 tokens only (no search costs)

## Cost Breakdown per Analysis

### Typical Single Analysis

```
Profile Fetching (2 users):
- Tokens: ~2,000 input + 1,000 output = ~$0.002
- Search: ~60 sources × $0.025 = ~$1.50

Vibe Matching:
- Tokens: ~3,000 input + 1,500 output = ~$0.003
- Search: 0 sources = $0.00

TOTAL: ~$1.505 per complete analysis
```

### Cost Optimization Achieved

- **Without optimization**: Would use Grok-4 with search for everything (~$5-10)
- **With optimization**: Uses Grok-3-mini and disables search for matching (~$1.50)
- **Savings**: ~70-85% cost reduction

## Search Parameters Configuration

### Enabling Search (Profile Fetching)

```typescript
searchParameters: {
  dataSources: ['x'],
  maxResults: 30,  // Limits sources used
}
```

### Disabling Search (Vibe Matching)

```typescript
// No searchParameters = no search costs
matchVibe: {
  model: 'grok-3-mini',
  temperature: 0.7,
  // No searchParameters defined
}
```

## Cost Tracking Implementation

The codebase includes comprehensive cost tracking:

```typescript
// Per-request tracking
trackGrokUsage(model, usage, logger);

// Session tracking
const sessionTracker = createSessionTracker();
sessionTracker.track(model, usage);
sessionTracker.logSessionSummary(logger);
```

### Logged Metrics

- Token counts (prompt, completion, reasoning)
- Sources used (Live Search)
- Cost breakdown (tokens vs search)
- Session totals

## Cost Reduction Strategies

### 1. Model Selection

- Use Grok-3-mini for simple tasks (90% cheaper)
- Reserve Grok-4 only for complex reasoning

### 2. Search Optimization

- Disable search when not needed (vibe matching)
- Limit `maxResults` to control source usage
- Cache fetched profiles to avoid repeated searches

### 3. Prompt Engineering

- Concise system prompts reduce input tokens
- Request structured JSON output to minimize output tokens
- Avoid unnecessary verbosity in prompts

### 4. Caching Strategy

- Cache user profiles for 24 hours
- Cache analysis results for repeated queries
- Implement Redis caching in production

## Monthly Cost Projections

Based on typical usage patterns:

| Analyses/Month | Token Costs | Search Costs | Total Cost |
| -------------- | ----------- | ------------ | ---------- |
| 100            | ~$0.50      | ~$150        | ~$150.50   |
| 500            | ~$2.50      | ~$750        | ~$752.50   |
| 1,000          | ~$5.00      | ~$1,500      | ~$1,505.00 |
| 5,000          | ~$25.00     | ~$7,500      | ~$7,525.00 |

## Monitoring Costs

### Development

```bash
# Check logs for cost tracking
npm run dev
# Look for: "Grok API: X sources | Y tokens | $Z"
```

### Production

- Monitor logs for cost metrics
- Set up alerts for unusual usage spikes
- Track daily/weekly/monthly totals
- Review `costBreakdown` in session logs

## Alternative Approaches

### Without Live Search (Not Recommended)

- Would require direct X API access ($200-5,000/month)
- Or web scraping (unreliable, against ToS)
- Live Search is most cost-effective for real data

### Single-Model Approach (Higher Cost)

- Using Grok-4 for everything: ~$5-10 per analysis
- Using Grok-3-mini for everything: Less accurate matching
- Two-stage approach balances cost and quality

## Environment Variables

```env
# Model configuration
GROK_MODEL_VERSION=grok-3-mini  # Override default model (default: grok-4-0709)
GROK_MAX_TOKENS=10000           # Maximum tokens per response (default: 10000)

# Future optimization flags
ENABLE_PROFILE_CACHE=true       # Cache profiles
ENABLE_RESULT_CACHE=true        # Cache results
MAX_SEARCH_SOURCES=20            # Limit search sources
```

### Max Tokens Configuration

The `GROK_MAX_TOKENS` environment variable controls the maximum number of tokens in Grok's responses:

- **Default**: 10,000 tokens (comprehensive responses)
- **Cost Impact**: More tokens = higher output costs
- **Quality Impact**: More tokens = more detailed analysis
- **Recommendations**:
  - 5,000-7,500: Basic analysis, lower costs
  - 10,000 (default): Balanced quality and cost
  - 15,000-20,000: Very detailed analysis, higher costs

Example cost impact per analysis:

- 5,000 max tokens: ~$0.75-1.00 total
- 10,000 max tokens: ~$1.50 total (default)
- 20,000 max tokens: ~$2.50-3.00 total

## Summary

- **Live Search**: $0.025 per source, tracked separately
- **Token costs**: Vary by model (Grok-3-mini 90% cheaper)
- **Optimization**: Search disabled for vibe matching phase
- **Total cost**: ~$1.50 per complete analysis
- **Savings**: 70-85% vs unoptimized approach

The current architecture successfully minimizes costs while maintaining analysis quality by:

1. Using cheaper models where appropriate
2. Disabling search when not needed
3. Tracking all costs for transparency
