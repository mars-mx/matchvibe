# MatchVibe Matching Algorithm Documentation

## Overview

MatchVibe uses a sophisticated two-prompt architecture to analyze X (Twitter) user compatibility. We leverage Grok's built-in X search capabilities to fetch user profiles without needing X API access, then perform deep compatibility analysis.

## Architecture

### Two-Prompt System

1. **FETCH_PROFILE** (Grok-3-mini): Fetches real user profile data via X search
2. **MATCH_VIBE** (Grok-4): Analyzes compatibility based on fetched profiles

### Why This Architecture Works

- **No X API Needed**: Grok has direct access to X data through search
- **Cost Efficient**: Uses cheaper Grok-3-mini for data fetching ($0.30/1M tokens)
- **Real-time Data**: Gets current user information through X search
- **Accurate Results**: Strict prompts prevent hallucination of profile data

### Model Selection Strategy

| Task             | Model       | Cost                  | Purpose                        |
| ---------------- | ----------- | --------------------- | ------------------------------ |
| Profile Fetching | Grok-3-mini | $0.30/1M input tokens | Simple data extraction from X  |
| Vibe Matching    | Grok-4      | $2/1M input tokens    | Complex compatibility analysis |

This two-tier approach reduces costs by 90% for profile fetching while maintaining high-quality analysis.

## User Profile Schema

Each user research prompt collects the following comprehensive data:

### UserProfile Interface

```typescript
interface UserProfile {
  // Basic Information
  username: string;
  displayName: string;
  bio: string;
  verificationStatus: boolean;
  accountAge: string; // Estimated from first tweet
  followerCount: number;
  followingCount: number;
  tweetCount: number;

  // Content Analysis (Last 30 days)
  contentMetrics: {
    totalTweets: number;
    originalTweets: number;
    retweets: number;
    quotes: number;
    replies: number;
    threads: number;

    // Content Quality Ratio
    shitpostRatio: number; // 0-100%
    qualityContentRatio: number; // 0-100%
    informativeRatio: number; // 0-100%
    humorRatio: number; // 0-100%

    // Media Usage
    imagesUsed: number;
    videosUsed: number;
    gifsUsed: number;
    pollsUsed: number;
    spacesHosted: number;
  };

  // Engagement Patterns
  engagementMetrics: {
    averageLikesPerTweet: number;
    averageRetweetsPerTweet: number;
    averageRepliesPerTweet: number;
    engagementRate: number; // (likes + RTs + replies) / impressions

    replyFrequency: 'very_high' | 'high' | 'moderate' | 'low' | 'minimal';
    replySpeed: 'instant' | 'quick' | 'moderate' | 'slow' | 'sporadic';
    replyDepth: number; // Average conversation thread depth

    // Interaction Patterns
    interactionRatio: number; // replies to others vs broadcasting
    supportiveResponseRate: number; // positive/supportive replies %
    criticalResponseRate: number; // critical/negative replies %
  };

  // Communication Style
  communicationStyle: {
    formality: 'very_formal' | 'formal' | 'casual' | 'very_casual' | 'mixed';
    humor: {
      type:
        | 'dry'
        | 'sarcastic'
        | 'wholesome'
        | 'edgy'
        | 'dad_jokes'
        | 'memes'
        | 'mixed'
        | 'minimal';
      frequency: 'constant' | 'frequent' | 'moderate' | 'occasional' | 'rare';
    };

    tone: {
      primary: 'positive' | 'neutral' | 'critical' | 'analytical' | 'entertaining';
      sentiment: number; // -100 to +100
      consistency: 'very_consistent' | 'consistent' | 'variable' | 'unpredictable';
    };

    languageComplexity: 'academic' | 'professional' | 'standard' | 'simple' | 'mixed';
    emojiUsage: 'heavy' | 'moderate' | 'minimal' | 'none';
    hashtagUsage: 'heavy' | 'moderate' | 'minimal' | 'none';

    writingStyle: {
      avgTweetLength: number;
      usesThreads: boolean;
      threadFrequency: 'daily' | 'weekly' | 'occasional' | 'rare' | 'never';
      punctuationStyle: 'proper' | 'casual' | 'minimal' | 'chaotic';
      capitalization: 'proper' | 'casual' | 'random' | 'all_lower' | 'all_caps';
    };
  };

  // Activity Patterns
  activityPatterns: {
    // Posting Schedule
    mostActiveHours: number[]; // [14, 15, 20, 21] for 2-3pm and 8-9pm
    mostActiveDays: string[]; // ['monday', 'tuesday', 'friday']
    postsPerDay: number;
    consistency: 'very_regular' | 'regular' | 'irregular' | 'sporadic';

    // Engagement Times
    peakEngagementHours: number[];
    responseTimePattern: 'business_hours' | 'evenings' | 'late_night' | 'random' | '24/7';
    weekendActivity: 'higher' | 'same' | 'lower' | 'none';
  };

  // Topics & Interests
  interests: {
    primaryTopics: string[]; // Top 5-10 topics they tweet about
    secondaryTopics: string[]; // Additional 5-10 topics

    topicBreakdown: {
      tech: number; // percentage
      politics: number;
      sports: number;
      entertainment: number;
      personal: number;
      professional: number;
      humor: number;
      news: number;
      other: number;
    };

    nicheCommunities: string[]; // Specific communities they engage with
    hashtagCommunities: string[]; // Hashtags they frequently use
  };

  // Social Dynamics
  socialDynamics: {
    influencerStatus: 'mega' | 'macro' | 'micro' | 'nano' | 'regular';
    communityRole: 'leader' | 'contributor' | 'lurker' | 'mixed';

    networkStyle: 'broadcaster' | 'conversationalist' | 'amplifier' | 'mixed';
    dramaInvolvement: 'high' | 'moderate' | 'minimal' | 'avoids';
    controversyLevel: 'high' | 'moderate' | 'low' | 'none';

    supportiveness: number; // 0-100 score
    toxicityLevel: number; // 0-100 score
  };

  // Behavioral Indicators
  behavioralIndicators: {
    authenticityScore: number; // 0-100 (original content vs retweets)
    consistencyScore: number; // 0-100 (posting pattern regularity)
    engagementQuality: number; // 0-100 (meaningful interactions)
    contentDiversity: number; // 0-100 (variety of topics/formats)

    // Red Flags
    spamIndicators: boolean;
    botBehavior: boolean;
    toxicBehavior: boolean;

    // Green Flags
    thoughtLeader: boolean;
    communityBuilder: boolean;
    helpfulResponder: boolean;
  };

  // Recent Activity Snapshot
  recentActivity: {
    last7Days: {
      tweetCount: number;
      topTopics: string[];
      notableInteractions: string[]; // Users they interacted with
      viralContent: boolean;
      sentiment: number; // -100 to +100
    };

    last30Days: {
      tweetCount: number;
      growthRate: number; // follower growth %
      engagementTrend: 'increasing' | 'stable' | 'decreasing';
      contentShift: string | null; // Any notable content changes
    };
  };

  // Metadata
  metadata: {
    dataCollectionTimestamp: string;
    sourcesAnalyzed: number;
    confidenceScore: number; // 0-100 for data quality
    dataCompleteness: number; // 0-100 for profile completeness
  };
}
```

## Matching Algorithm

### Compatibility Analysis Schema

```typescript
interface MatchingAnalysis {
  // Overall Score
  overallScore: number; // 0-100
  confidence: number; // 0-100 confidence in the score

  // Category Scores
  categoryScores: {
    contentCompatibility: number; // How well content styles match
    engagementCompatibility: number; // Interaction style alignment
    communicationCompatibility: number; // Language and tone match
    scheduleCompatibility: number; // Active hours overlap
    interestCompatibility: number; // Shared topics and interests
    socialCompatibility: number; // Network style alignment
    energyCompatibility: number; // Posting frequency and intensity match
  };

  // Detailed Analysis
  analysis: {
    summary: string; // 2-3 sentence executive summary

    strengths: {
      primary: string[]; // Top 3-5 major compatibility strengths
      secondary: string[]; // Additional 3-5 minor strengths
      unexpected: string[]; // Surprising compatibility points
    };

    challenges: {
      major: string[]; // Significant compatibility issues
      minor: string[]; // Small friction points
      dealBreakers: string[]; // Fundamental incompatibilities
    };

    dynamics: {
      predictedInteractionStyle: string; // How they'd likely interact
      conversationPotential: 'excellent' | 'good' | 'moderate' | 'poor';
      conflictPotential: 'high' | 'moderate' | 'low' | 'minimal';
      growthPotential: 'high' | 'moderate' | 'low'; // Learning from each other
    };
  };

  // Specific Insights
  insights: {
    sharedInterests: {
      strong: string[]; // Topics both are passionate about
      moderate: string[]; // Topics both occasionally discuss
      complementary: string[]; // Different but compatible interests
    };

    communicationInsights: {
      languageMatch: string; // Description of language compatibility
      humorAlignment: string; // How their humor styles work together
      conflictStyle: string; // How they might handle disagreements
    };

    activityInsights: {
      bestInteractionWindow: number[]; // Best hours for interaction
      expectedResponseTime: string; // How quickly they'd reply to each other
      engagementPrediction: string; // Type of engagement expected
    };

    warnings: string[]; // Any red flags or concerns
    opportunities: string[]; // Unique opportunities for connection
  };

  // Recommendations
  recommendations: {
    iceBreakers: string[]; // Suggested conversation starters
    topicsToExplore: string[]; // Good discussion topics
    topicsToAvoid: string[]; // Potentially problematic topics

    interactionTips: {
      forUserOne: string[]; // Tips for user one
      forUserTwo: string[]; // Tips for user two
      mutual: string[]; // Tips for both
    };
  };

  // Match Type Classification
  matchType: {
    primary: 'perfect_match' | 'complementary' | 'growth' | 'challenging' | 'incompatible';
    subtype: string; // More specific classification
    description: string; // Explanation of the match type
  };

  // Metadata
  metadata: {
    analysisTimestamp: string;
    userOneProfile: string; // Reference to cached profile
    userTwoProfile: string; // Reference to cached profile
    modelVersion: string;
    analysisDepth: 'quick' | 'standard' | 'deep';
  };
}
```

## Matching Logic

### Weight Distribution

The matching algorithm uses weighted scoring across categories:

1. **Content Compatibility (25%)**
   - Shitpost ratio alignment: ±20% difference = high compatibility
   - Content quality match: Similar quality/humor ratios
   - Media usage patterns: Similar use of images/videos/threads

2. **Engagement Compatibility (20%)**
   - Reply frequency alignment
   - Interaction style match (broadcaster vs conversationalist)
   - Response time compatibility

3. **Communication Compatibility (20%)**
   - Humor type and frequency match
   - Formality level alignment
   - Tone and sentiment compatibility
   - Language complexity match

4. **Interest Compatibility (15%)**
   - Shared primary topics (higher weight)
   - Overlapping secondary interests
   - Complementary interests that spark conversation

5. **Schedule Compatibility (10%)**
   - Active hours overlap
   - Peak engagement time alignment
   - Weekend activity patterns

6. **Social Compatibility (10%)**
   - Network style alignment
   - Drama tolerance match
   - Community role compatibility

### Special Considerations

#### High Compatibility Indicators

- **Shitposters with Shitposters**: >70% shitpost ratio for both = +15 bonus points
- **Quality Content Creators**: Both >60% quality content = +10 bonus points
- **Reply Guys Match**: Both high reply frequency = +10 bonus points
- **Timezone Sync**: >6 hours daily overlap = +5 bonus points

#### Compatibility Penalties

- **Energy Mismatch**: One posts 20+/day, other <2/day = -15 points
- **Tone Conflict**: Positive vs negative sentiment = -20 points
- **Drama Mismatch**: Drama seeker vs drama avoider = -25 points
- **Communication Style Clash**: Very formal vs very casual = -15 points

#### Deal Breakers (Auto <20 score)

- Toxicity level >70 for either user
- Complete timezone mismatch (<2 hours overlap)
- Opposite political extremes with high political content
- Bot behavior detected

## Caching Strategy

### User Profile Cache

- **Duration**: 24 hours
- **Key**: `user_profile:{username}:{date}`
- **Invalidation**: On username change or manual refresh
- **Storage**: Redis (production) or in-memory (development)

### Benefits

- Reduce API calls by 50% for repeat analyses
- Enable user comparison history
- Support bulk analysis features
- Improve response times

## Implementation Notes

### API Call Optimization

1. Research prompts can run in parallel
2. Use streaming for real-time progress updates
3. Implement retry logic with exponential backoff
4. Cache partial results on failure

### Error Handling

- Validate user existence before research
- Handle rate limits gracefully
- Provide meaningful error messages
- Fall back to cached data when available

### Privacy Considerations

- Only analyze public tweets
- Don't store personal information beyond cache duration
- Allow users to request cache deletion
- Anonymize data in logs

## Future Enhancements

1. **Machine Learning Integration**
   - Train on successful matches
   - Refine weight distribution
   - Predict long-term compatibility

2. **Historical Analysis**
   - Track profile changes over time
   - Identify compatibility trends
   - Seasonal behavior patterns

3. **Group Matching**
   - Analyze compatibility for 3+ users
   - Community fit analysis
   - Team dynamics prediction

4. **Sentiment Evolution**
   - Track conversation sentiment over time
   - Predict relationship trajectory
   - Identify potential conflict points

## Testing Strategy

### Unit Tests

- Schema validation for all interfaces
- Prompt generation with edge cases
- Score calculation accuracy
- Cache hit/miss scenarios

### Integration Tests

- Full three-prompt flow
- Parallel processing verification
- Error recovery mechanisms
- Rate limit handling

### Performance Benchmarks

- Target: <5 seconds for cached users
- Target: <15 seconds for new analysis
- Cache hit rate: >40% in production
- API efficiency: <3 calls per analysis
