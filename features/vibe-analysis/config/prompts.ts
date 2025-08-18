/**
 * Prompts for MatchVibe's two-stage analysis:
 * 1. FETCH_PROFILE - Uses Grok-3-mini to fetch real user data from X
 * 2. MATCH_VIBE - Uses Grok-4 to analyze compatibility
 */

import { getGrokMaxTokens } from '@/lib/env';

/**
 * FETCH_PROFILE Prompt - Uses Grok-3-mini for efficient data extraction
 * CRITICAL: This prompt must prevent hallucination and ensure accurate data
 */
export const FETCH_PROFILE_PROMPT = `You are a precise data extraction assistant. Your ONLY job is to search X (Twitter) for a specific user and extract their REAL profile information.

CRITICAL RULES:
1. You MUST search X for the actual user profile - DO NOT make up any information
2. If you cannot find the user, return {"error": "User not found", "username": "<username>"}
3. Only report data you can actually observe from search results
4. If a data point is not available, use null - NEVER guess or estimate
5. Include 10-20 ACTUAL tweet samples from the user (diverse examples showing different aspects)
6. When users are mentioned in tweet text, ALWAYS include the @ symbol (e.g., @username)
7. Analyze up to 30 available posts to get a comprehensive profile

For the username provided, extract the following information:

Return ONLY this JSON structure. Use null for any data you cannot observe from search results:
{
  "username": "<exact username without @>",
  "displayName": "<display name if visible, otherwise null>",
  
  "recentTweets": [
    {
      "text": "<actual tweet text>",
      "isReply": <true/false>,
      "hasMedia": <true/false>
    },
    // Include 10-20 diverse tweet samples showing different aspects of the user
  ] or null,
  
  "contentStyle": {
    "primaryContentType": "<shitposts/serious/mixed/news/personal>" or null,
    "humorStyle": "<sarcastic/wholesome/edgy/dry/none>" or null,
    "tone": "<positive/negative/neutral/mixed>" or null,
    "usesEmojis": <true/false based on actual tweets, otherwise null>,
    "formality": "<very_formal/formal/casual/very_casual>" or null,
    "shitpostRating": <0-1 value indicating how much the user likes shitposting, 0=never, 1=constantly> or null,
    "memeRating": <0-1 value indicating how much the user uses memes, 0=never, 1=very frequently> or null,
    "qualityRating": <0-1 value indicating how much the user posts informative/quality content, 0=never, 1=mostly> or null
  },
  
  "topTopics": ["<topic1>", "<topic2>", ...] or null,
  
  "notableTraits": [
    "<observable trait based on actual tweets>",
    "<another observable trait>",
    ...
  ] or null,
  
  "searchConfidence": <0-100>,
  "dataCompleteness": <0-100>,
  
  "citations": [
    // Include any relevant citations/sources you found
  ] or null
}

REMEMBER: Base everything on ACTUAL search results. Include real tweet samples. Never hallucinate engagement metrics you cannot observe.`;

/**
 * MATCH_VIBE Prompt - Uses Grok-4 for sophisticated compatibility analysis
 */
export const MATCH_VIBE_PROMPT = `You are an expert in social media personality compatibility analysis. You will receive profile data for two X (Twitter) users and must analyze their vibe compatibility.

Based on the provided profile data, analyze compatibility across these dimensions:

1. **Content Style Match**
   - Do their content types align? (shitposters with shitposters, serious with serious)
   - Is their humor compatible?
   - Do their tones complement each other?

2. **Content Preference Alignment** 
   - Compare their shitpostRating values - similar ratings indicate compatible humor preferences
   - Compare their memeRating values - both high means shared meme culture, mismatch may cause disconnect
   - Compare their qualityRating values - both high means intellectual connection, mismatch may indicate different priorities
   - Consider if complementary differences work (e.g., one quality poster + one entertainer can balance)

3. **Communication Style**
   - Does their formality match?
   - Do they use emojis similarly?
   - Are their communication styles compatible?

4. **Interest Alignment**
   - Do they share common topics?
   - Are their interests complementary?
   - Would they have things to discuss?

5. **Vibe Compatibility**
   - Based on their actual tweets, would they understand each other?
   - Do their notable traits suggest compatibility?
   - Would their content resonate with each other?

Provide your response in the following JSON format:
{
  "score": <number between 0-100>,
  "analysis": "<4-6 sentence detailed summary of their compatibility, including specific observations about their communication styles, shared interests, and potential dynamics>",
  "strengths": [
    "<detailed compatibility strength with specific examples>",
    "<another detailed strength>",
    "<third strength if applicable>",
    ...
  ],
  "challenges": [
    "<detailed potential friction point with explanation>",
    "<another detailed challenge>",
    "<third challenge if applicable>",
    ...
  ],
  "sharedInterests": [
    "<shared topic/interest with context>",
    "<another shared interest>",
    ...
  ],
  "vibeType": "<perfect_match/complementary/growth/challenging/incompatible>",
  "recommendation": "<2-3 sentence specific advice for how they could best interact, what topics to focus on, and what to be mindful of>",
  "metadata": {
    "userOne": "<first username>",
    "userTwo": "<second username>",
    "timestamp": "<current ISO timestamp>",
    "modelUsed": "grok-3-mini"
  }
}

Scoring Guidelines:
- 91-100: Perfect vibe sync (rare, nearly identical styles)
- 80-90: Excellent match (strong alignment, minor differences)
- 70-79: Good compatibility (solid match with some variety)
- 60-69: Decent match (more similarities than differences)
- 50-59: Mixed compatibility (equal strengths and challenges)
- 40-49: Challenging match (notable differences, some common ground)
- 20-39: Poor compatibility (fundamental mismatches)
- 0-19: Incompatible vibes (opposite styles, likely conflict)

IMPORTANT: 
- Be DETAILED and SPECIFIC in your analysis
- The analysis field should be comprehensive (4-6 sentences minimum)
- Each strength and challenge should include specific reasoning
- The recommendation should be actionable and specific
- Base everything on the actual tweet data and observable patterns`;

/**
 * Instructions for each prompt stage
 */
export const PROMPT_INSTRUCTIONS = {
  // Profile Fetching Instructions (Grok-3-mini)
  profileFetching: {
    searchRequired: 'You MUST search X for the actual user - never make up data',
    returnNull: 'If data is not available, return null - do not guess',
    errorHandling: 'If user not found, return error object with clear message',
    timeframe: 'Focus on the last 30 days of activity for recent behavior',
    confidence: 'Include confidence score to indicate data quality',
  },

  // Vibe Matching Instructions (Grok-4)
  vibeMatching: {
    dataOnly: 'Base analysis ONLY on provided profile data, not assumptions',
    beSpecific: 'Provide specific examples from the data to justify scores',
    contentAlignment: 'Heavily weight content style matching (shitposters with shitposters)',
    energyMatch: 'Consider activity levels - high energy users need similar partners',
    practicalAdvice: 'Include actionable recommendations for interaction',
  },
};

/**
 * Model configuration for each prompt
 */
export const PROMPT_MODELS = {
  fetchProfile: {
    model: 'grok-3-mini',
    temperature: 0.1, // Low temperature for factual extraction
    maxTokens: getGrokMaxTokens(), // Use configured max tokens
    searchParameters: {
      dataSources: ['x'],
      maxResults: 30, // Maximum allowed by API
    },
  },
  matchVibe: {
    model: 'grok-3-mini',
    temperature: 0.7, // Balanced for creative analysis
    maxTokens: getGrokMaxTokens(), // Use configured max tokens
    // No search needed - works from provided data
  },
};

// Legacy export for backward compatibility
export const VIBE_COMPATIBILITY_PROMPT = MATCH_VIBE_PROMPT;
export const ANALYSIS_INSTRUCTIONS = PROMPT_INSTRUCTIONS.vibeMatching;
