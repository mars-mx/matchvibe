# X API Limitations and MatchVibe Architecture

## Overview

This document explains the X (Twitter) API limitations and why MatchVibe uses Grok API for user analysis instead of direct X API access.

## X API v2 Free Tier Limitations

Based on official X API documentation ([source](https://docs.x.com/x-api)):

### Monthly Limits

- **Reads**: 100 posts/month
- **Writes**: 500 posts/month
- **Projects**: 1 project
- **Apps**: 1 app per project
- **Access**: Basic v2 endpoints only

### Rate Limits

According to the [official rate limits documentation](https://docs.x.com/x-api/fundamentals/rate-limits), the free tier has extremely restrictive limits:

#### Tweet Endpoints

- `GET /2/tweets`: **1 request per 15 minutes** (per user and per app)
- `GET /2/tweets/:id`: **1 request per 15 minutes** (per user and per app)
- `POST /2/tweets`: 17 requests per 24 hours
- `DELETE /2/tweets/:id`: 17 requests per 24 hours

#### User Endpoints

- `GET /2/users`: **1 request per 24 hours** (per user and per app)
- `GET /2/users/:id`: **1 request per 24 hours** (per user and per app)

### What This Means

With these limits, the free tier allows:

- Looking up **only 1 user per day**
- Fetching **only 1 tweet every 15 minutes**
- No access to timelines, search, or streaming endpoints
- No ability to fetch user tweets or analyze posting patterns

## X API Paid Tiers

Source: [X API Pricing](https://docs.x.com/x-api)

### Basic Tier - $200/month

- **Reads**: 15,000 posts/month
- **Writes**: 50,000 posts/month
- **Apps**: 2 apps per project
- **Access**: Full v2 endpoints

### Pro Tier - $5,000/month

- **Reads**: 1,000,000 posts/month
- **Writes**: 300,000 posts/month
- **Apps**: 3 apps per project
- **Features**: Full-archive search, filtered stream
- **Support**: Priority support

### Enterprise Tier - Custom Pricing

- Custom solutions for large commercial projects
- Complete streams and backfill capabilities
- Dedicated support

## Why X API Doesn't Work for MatchVibe

### Free Tier Issues

1. **Cannot Analyze Two Users**: With only 1 user lookup per 24 hours, we can't even fetch both users' profiles for a single comparison
2. **No Tweet Access**: Cannot fetch users' tweets to analyze content patterns
3. **No Search**: Cannot search for user activity or mentions
4. **No Timeline Access**: Cannot see what users post or interact with
5. **Rate Limits**: 1 request per 15 minutes makes real-time analysis impossible

### Even Paid Tiers Are Limiting

- **Basic ($200/month)**: 15,000 reads = ~500 analyses/month (if each needs 30 tweets)
- **Pro ($5,000/month)**: Expensive for an open-source project
- **No Open Source Provisions**: X API documentation shows no special pricing or access for open-source projects

## The Grok API Alternative

### Why We Use Grok

Since direct X API access is not viable, MatchVibe uses Grok API which has:

1. **Built-in X Search**: Grok can search and analyze X posts in real-time
2. **No User Lookup Limits**: Can analyze any publicly visible X users
3. **Rich Context**: Accesses recent tweets, interactions, and patterns
4. **Cost-Effective**: Pay per API call rather than monthly subscriptions

### Current Implementation

```typescript
// From grok.service.ts
searchParameters: {
  searchMode: 'normal',
  dataSources: ['x'],  // Search X/Twitter data
  maxResults: 40,
}
```

### Limitations of Grok Approach

1. **No Direct Profile Access**: Cannot fetch exact follower counts or verified status
2. **Search-Based**: Relies on what Grok can find through search
3. **No Historical Data**: Limited to recent activity Grok can search
4. **API Costs**: Each analysis has token and search costs

## Cost Comparison

### X API Direct Access

- **Free**: Unusable (1 user lookup/day)
- **Basic**: $200/month for limited analyses
- **Pro**: $5,000/month for reasonable volume

### Grok API (Current Solution)

- **No Monthly Fee**: Pay-as-you-go model
- **Token Costs**: $0.30-3.00 per 1M input tokens depending on model
- **Live Search Costs**: $0.025 per source used (when search enabled)
- **Flexible**: Scales with usage
- **Rich Analysis**: AI-powered interpretation of user patterns

### Grok Live Search Pricing Details

- **Cost**: $25 per 1,000 sources ($0.025 per source)
- **Typical Usage**: 30 sources per profile fetch = $0.75 per user
- **Optimization**: Search disabled for vibe matching phase (saves ~$1.50 per analysis)
- **Total per Analysis**: ~$1.50 including both tokens and search

## The MatchVibe Solution: Grok API

### How We Bypass X API Limitations

MatchVibe uses **Grok's built-in X search capabilities** to fetch user profiles without needing X API access:

#### Two-Tier Model Strategy

| Purpose              | Model       | Cost                  | Why                            |
| -------------------- | ----------- | --------------------- | ------------------------------ |
| **Profile Fetching** | Grok-3-mini | $0.30/1M input tokens | Simple data extraction task    |
| **Vibe Analysis**    | Grok-4      | $2/1M input tokens    | Complex compatibility analysis |

#### Cost Comparison

- **X API Basic**: $200/month for limited lookups
- **Grok-3-mini Profile Fetch**: ~$0.001 tokens + $0.75 search = ~$0.75 per user
- **Grok-3-mini Vibe Match**: ~$0.002 tokens only (search disabled)
- **Total per Analysis**: ~$1.50 (both users + matching)
- **Savings**: Pay-as-you-go vs $200/month subscription

### How It Works

1. **FETCH_PROFILE Prompt** (Grok-3-mini):
   - Searches X for user profile via Grok's search API
   - Extracts real data: bio, follower count, recent activity
   - Strict instructions prevent hallucination
   - Returns null for unavailable data (never guesses)

2. **MATCH_VIBE Prompt** (Grok-4):
   - Receives profile data from step 1
   - Performs sophisticated compatibility analysis
   - No additional API calls needed

### Advantages Over X API

- **No Rate Limits**: Not subject to 1 user/24 hours restriction
- **Real-Time Data**: Grok searches current X content
- **Cost Effective**: Pay per use, no monthly subscription
- **Complete Data**: Can analyze tweets, not just profile metadata
- **Batch Processing**: Can fetch multiple profiles in parallel

### Implementation Details

```typescript
// Profile fetching with Grok-3-mini
const profileConfig = {
  model: 'grok-3-mini',
  temperature: 0.1, // Low for factual accuracy
  searchParameters: {
    dataSources: ['x'],
    maxResults: 10,
  },
};

// Vibe matching with Grok-3-mini
const matchConfig = {
  model: 'grok-3-mini',
  temperature: 0.7, // Balanced for analysis
  // No search parameters = no Live Search costs ($0.025/source saved)
  // Works from pre-fetched profile data
};
```

## Alternative Methods for Profile Data (Not Recommended)

### The Authentication Wall (2024-2025)

Since 2024, X has implemented mandatory login requirements:

- **No Public Access**: X now requires users to create an account to access content
- **Login Wall**: Nearly all content, including public profiles, is behind authentication
- **Timeline**: Most third-party access methods (like Nitter) stopped working in January 2024

### Web Scraping Services

For projects that need profile data, commercial scraping services offer alternatives:

#### Paid Services

- **Lobstr.io**: 100+ profiles/minute, 20+ data points per profile
- **Apify Twitter Scraper**: No login required, bypasses rate limits
- **ScraperAPI/Scrapingbee**: General web scrapers that can handle X
- **Cost Range**: $50-500/month depending on volume

#### Open Source Tools

- **ElizaOS agent-twitter-client**: Best free tool, no API keys needed, no visible rate limits
- **Nitter instances**: Increasingly unreliable (most stopped January 2024)
- **Python + Playwright/Selenium**: DIY solution but high risk of IP blocks

### Limited Free Workarounds

1. **Search Engine Cache**: `site:x.com username` on Google may show cached profile info
2. **Embedded Content**: Tweets embedded on other sites remain visible
3. **Archive Services**: Wayback Machine might have historical snapshots
4. **User-Provided Data**:
   - Ask users to screenshot their profiles
   - Have users export data from X settings
   - OAuth flow (requires user consent)

### Legal and Technical Considerations

#### Legal Aspects

- Public data is generally scrapable
- Must respect rate limits to avoid service damage
- Cannot store EU citizens' PII without consent (GDPR)
- Cannot use copyrighted content commercially

#### Technical Risks

- **IP Blocks**: X has aggressive anti-scraping measures
- **Account Bans**: Risk when using credentials
- **Instability**: Frontend changes can break scrapers
- **Cloud Provider IPs**: AWS/GCP/Azure IPs often blocked

## Recommendations for Open Source Projects

1. **Avoid Direct X API**: The free tier is essentially unusable for any meaningful application
2. **Best Alternatives for MatchVibe**:
   - Continue using Grok API (has X search access)
   - Consider caching any successfully retrieved data
   - Be transparent about limitations
3. **Inform Users**: Explain why exact follower counts or verified status aren't available
4. **Cache Aggressively**: Store results to minimize API calls

## Conclusion

The X API's free tier with its 1 user lookup per 24 hours makes it impossible to build a user comparison tool without significant monthly costs. This is why MatchVibe uses Grok's AI-powered search capabilities instead of direct X API access.

While this approach has limitations (no direct profile access, search-based data), it's the only viable solution for an open-source project that needs to analyze X user compatibility without requiring users to pay $200-5,000/month for API access.

## References

- [X API Documentation](https://docs.x.com/x-api)
- [X API Rate Limits](https://docs.x.com/x-api/fundamentals/rate-limits)
- [X API Getting Started](https://docs.x.com/x-api/getting-started/about-x-api)
