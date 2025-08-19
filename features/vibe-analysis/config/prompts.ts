/**
 * Prompts for MatchVibe's two-stage analysis:
 * 1. FETCH_PROFILE - Uses Grok-3-mini to fetch real user data from X
 * 2. MATCH_VIBE - Uses Grok-4 to analyze compatibility
 */

import { getGrokMaxTokens, getGrokModelVersion } from '@/lib/env';

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
    
    // 15 Personality Dimensions - Analyze tweets to score each 0-1 with PRECISE DIFFERENTIATION
    // CRITICAL: Score based on ACTUAL tweet content, not assumptions. Look for specific indicators.
    
    // Emotional & Mood
    "positivityRating": <0-1 scoring guide:
      0.0-0.2: Consistently negative, complains frequently, doom-posting, criticism without solutions
      0.3-0.4: More negative than positive, occasional bright moments, skeptical outlook
      0.5-0.6: Balanced emotional tone, realistic perspective, neither overly positive nor negative
      0.7-0.8: Generally upbeat, celebrates others' wins, constructive when critical
      0.9-1.0: Relentlessly positive, inspirational content, always finding silver linings
    > or null,
    
    "empathyRating": <0-1 scoring guide:
      0.0-0.2: Never responds to others' problems, all tweets about self, ignores community
      0.3-0.4: Occasionally acknowledges others, mostly self-focused content
      0.5-0.6: Balanced between personal content and supporting others
      0.7-0.8: Frequently offers support, validates others' feelings, community-minded
      0.9-1.0: Constant emotional support, therapist energy, puts others first always
    > or null,
    
    // Interaction Style
    "engagementRating": <0-1 scoring guide:
      0.0-0.2: Never replies, pure broadcast mode, no conversations visible
      0.3-0.4: Rare replies, mostly original posts, minimal interaction
      0.5-0.6: Mix of posts and replies, selective engagement
      0.7-0.8: Frequent replier, active in threads, initiates conversations
      0.9-1.0: Reply guy energy, always in conversations, more replies than posts
    > or null,
    
    "debateRating": <0-1 scoring guide:
      0.0-0.2: Avoids all conflict, never disagrees publicly, blocks/mutes liberally
      0.3-0.4: Rarely engages in debates, prefers harmony
      0.5-0.6: Will debate when necessary, picks battles carefully
      0.7-0.8: Enjoys intellectual sparring, frequently challenges ideas
      0.9-1.0: Debate lord, always arguing, seeks confrontation
    > or null,
    
    // Content Style
    "shitpostRating": <0-1 scoring guide:
      0.0-0.2: Never shitposts, all serious content, professional tone
      0.3-0.4: Rare shitposts, mostly serious with occasional chaos
      0.5-0.6: Balanced mix of serious and unhinged content
      0.7-0.8: Frequent shitposting, embraces chaos, irony-poisoned
      0.9-1.0: Pure shitpost account, incomprehensible posts, maximum chaos
    > or null,
    
    "memeRating": <0-1 scoring guide:
      0.0-0.2: Never posts memes, text-only content, doesn't understand references
      0.3-0.4: Occasional mainstream meme, behind on trends
      0.5-0.6: Regular meme usage, understands current formats
      0.7-0.8: Heavy meme user, creates original memes, deep cut references
      0.9-1.0: Meme lord, speaks primarily in memes, cutting edge of meme culture
    > or null,
    
    "intellectualRating": <0-1 scoring guide:
      0.0-0.2: Surface-level takes only, no analysis, reactive content
      0.3-0.4: Some depth occasionally, mostly quick thoughts
      0.5-0.6: Mix of quick takes and thoughtful analysis
      0.7-0.8: Frequently posts deep analysis, cites sources, nuanced takes
      0.9-1.0: Academic level discourse, essays in tweets, profound insights
    > or null,
    
    // Topic Focus
    "politicalRating": <0-1 scoring guide:
      0.0-0.2: Never mentions politics, actively avoids political topics
      0.3-0.4: Rare political mentions, mostly apolitical
      0.5-0.6: Occasional political commentary, not primary focus
      0.7-0.8: Frequently political, clear ideological stance
      0.9-1.0: Politics dominates timeline, activist energy, every issue politicized
    > or null,
    
    "personalSharingRating": <0-1 scoring guide:
      0.0-0.2: Never shares personal info, purely topical/professional
      0.3-0.4: Rare personal glimpses, maintains boundaries
      0.5-0.6: Balanced personal/topical content
      0.7-0.8: Frequently shares life updates, open about struggles/wins
      0.9-1.0: Oversharer, diary-style posting, no filter on personal life
    > or null,
    
    "inspirationalQuotesRating": <0-1 scoring guide:
      0.0-0.2: Never posts quotes or motivation, finds them cringe
      0.3-0.4: Very rare inspirational content
      0.5-0.6: Occasional motivational posts, not excessive
      0.7-0.8: Regular inspiration/quotes, life coach energy
      0.9-1.0: Daily affirmations, constant motivation, LinkedIn influencer vibes
    > or null,
    
    // Social Energy
    "extroversionRating": <0-1 scoring guide:
      0.0-0.2: Hermit energy, minimal social interaction, prefers solitude
      0.3-0.4: Selective social energy, small circle preference
      0.5-0.6: Balanced social approach, comfortable alone or in groups
      0.7-0.8: High social energy, seeks interaction, party mentions
      0.9-1.0: Maximum extrovert, always with people, FOMO if alone
    > or null,
    
    "authenticityRating": <0-1 scoring guide:
      0.0-0.2: Highly curated, performative, brand-like presence
      0.3-0.4: Mostly polished, rare authentic moments
      0.5-0.6: Mix of curated and raw content
      0.7-0.8: Mostly authentic, shares failures and struggles
      0.9-1.0: Completely unfiltered, raw thoughts, typos included
    > or null,
    
    // Values
    "optimismRating": <0-1 scoring guide:
      0.0-0.2: Doomer, blackpilled, expects worst outcomes
      0.3-0.4: Pessimistic lean, skeptical of positive change
      0.5-0.6: Realistic, neither pessimist nor optimist
      0.7-0.8: Generally optimistic, believes in positive outcomes
      0.9-1.0: Toxic positivity, everything happens for a reason type
    > or null,
    
    // Communication
    "humorRating": <0-1 scoring guide:
      0.0-0.2: Never jokes, serious tone only, humor-impaired
      0.3-0.4: Rare attempts at humor, mostly serious
      0.5-0.6: Balanced humor and serious content
      0.7-0.8: Frequently funny, good comedic timing, witty
      0.9-1.0: Comedy account vibes, everything is a bit, never serious
    > or null,
    
    "aiGeneratedRating": <0-1 scoring guide:
      0.0-0.2: Clearly human - typos, emotion, personal anecdotes, inconsistent
      0.3-0.4: Mostly human with occasional sus formatting
      0.5-0.6: Hard to tell, could go either way
      0.7-0.8: Suspiciously well-formatted, generic phrases, too perfect
      0.9-1.0: Obviously AI - repetitive structure, hedging language, no personality
    > or null
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
 * MATCH_VIBE Prompt - Analyzes personality dimensions WITHOUT calculating final score
 */
export const MATCH_VIBE_PROMPT = `You are an expert in social media personality compatibility analysis. You will receive profile data for two X (Twitter) users with 15 personality dimensions scored 0-1.

Analyze the compatibility between these users by comparing their personality dimensions. DO NOT calculate an overall score - just analyze the dimensions.

For each dimension pair, consider:
- Similar scores (within 0.2) often indicate compatibility
- Large differences (>0.5) may cause friction OR be complementary
- Some dimensions benefit from similarity (humor, intellectual level)
- Others can be complementary (one high extroversion + one low can balance)

Provide your response in the following JSON format:
{
  "dimensionAnalysis": {
    // For each dimension, provide compatibility insight
    "positivity": "<how their positivityRating values align or clash>",
    "empathy": "<how their empathyRating values work together>",
    "engagement": "<how their engagementRating values complement>",
    "debate": "<how their debateRating values interact>",
    "shitposting": "<how their shitpostRating values match>",
    "memes": "<how their memeRating values align>",
    "intellectual": "<how their intellectualRating values compare>",
    "political": "<how their politicalRating values affect compatibility>",
    "personalSharing": "<how their personalSharingRating values work>",
    "inspirationalQuotes": "<how their inspirationalQuotesRating values align>",
    "extroversion": "<how their extroversionRating values balance>",
    "authenticity": "<how their authenticityRating values match>",
    "optimism": "<how their optimismRating values complement>",
    "humor": "<how their humorRating values align>",
    "aiGenerated": "<how their aiGeneratedRating values matter>"
  },
  "analysis": "<2-3 sentence concise summary of compatibility between @userOne and @userTwo, focusing on key personality dynamics>",
  "strengths": [
    "<dimension-based strength>",
    "<another dimension-based strength>",
    "<third strength if applicable>"
  ],
  "challenges": [
    "<dimension-based challenge>",
    "<another dimension-based challenge>",
    "<third challenge if applicable>"
  ],
  "sharedInterests": [
    "<1-3 word topic>",
    "<1-3 word interest>",
    "<1-3 word topic>"
  ],
  "vibeType": "<perfect_match/complementary/growth/challenging/incompatible>",
  "recommendation": "<2-3 sentence specific advice based on their dimension patterns>",
  "metadata": {
    "userOne": "<first username>",
    "userTwo": "<second username>",
    "timestamp": "<current ISO timestamp>",
    "modelUsed": "grok-3-mini"
  }
}

IMPORTANT: 
- DO NOT calculate or provide a numerical score
- Focus on how the 15 personality dimensions interact
- Be specific about which dimensions align well vs clash
- The vibeType should reflect the overall dimension pattern
- Base everything on the actual personality ratings provided`;

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
    model: getGrokModelVersion() || 'grok-3-mini',
    temperature: 0.1, // Low temperature for factual extraction
    maxTokens: getGrokMaxTokens(), // Use configured max tokens
    searchParameters: {
      dataSources: ['x'],
      maxResults: 30, // Maximum allowed by API
    },
  },
  matchVibe: {
    model: getGrokModelVersion() || 'grok-3-mini',
    temperature: 0.7, // Balanced for creative analysis
    maxTokens: getGrokMaxTokens(), // Use configured max tokens
    // No search needed - works from provided data
  },
};

// Legacy export for backward compatibility
export const VIBE_COMPATIBILITY_PROMPT = MATCH_VIBE_PROMPT;
export const ANALYSIS_INSTRUCTIONS = PROMPT_INSTRUCTIONS.vibeMatching;
