/**
 * Prompt builder for Grok API interactions
 * Handles prompt construction and input sanitization
 */

import { FETCH_PROFILE_PROMPT, MATCH_VIBE_PROMPT } from '../../config/prompts';
import type { UserProfile } from '../../types';

/**
 * Branded type for sanitized usernames
 */
export type SanitizedUsername = string & { __brand: 'SanitizedUsername' };

/**
 * Builds and sanitizes prompts for Grok API calls
 */
export class GrokPromptBuilder {
  private static readonly MAX_USERNAME_LENGTH = 50;
  private static readonly INJECTION_PATTERNS = [
    { pattern: /\n\s*System:/gi, replacement: '[SYSTEM]' },
    { pattern: /\n\s*Assistant:/gi, replacement: '[ASSISTANT]' },
    { pattern: /\n\s*Human:/gi, replacement: '[HUMAN]' },
    { pattern: /\n\s*User:/gi, replacement: '[USER]' },
  ];

  /**
   * Build a prompt for fetching a user profile
   * @param username - The username to fetch (will be sanitized)
   * @returns Object containing system and user prompts
   */
  buildProfileFetchPrompt(username: string): {
    systemPrompt: string;
    userPrompt: string;
    sanitizedUsername: SanitizedUsername;
  } {
    const sanitizedUsername = this.sanitizeUsername(username);

    return {
      systemPrompt: FETCH_PROFILE_PROMPT,
      userPrompt: `Fetch profile for X user: @${sanitizedUsername}`,
      sanitizedUsername,
    };
  }

  /**
   * Build a prompt for matching two user profiles
   * @param profileOne - First user's profile
   * @param profileTwo - Second user's profile
   * @returns Object containing system and user prompts
   */
  buildMatchingPrompt(
    profileOne: UserProfile,
    profileTwo: UserProfile
  ): {
    systemPrompt: string;
    userPrompt: string;
  } {
    const profilesData = JSON.stringify({
      userOne: profileOne,
      userTwo: profileTwo,
    });

    return {
      systemPrompt: MATCH_VIBE_PROMPT,
      userPrompt: profilesData,
    };
  }

  /**
   * Sanitize a username to prevent prompt injection
   * @param username - Raw username input
   * @returns Sanitized username safe for prompt inclusion
   */
  private sanitizeUsername(username: string): SanitizedUsername {
    let sanitized = username;

    // Remove control characters and non-printable chars
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Apply injection prevention patterns
    for (const { pattern, replacement } of GrokPromptBuilder.INJECTION_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
    }

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Limit length to prevent prompt stuffing
    sanitized = sanitized.slice(0, GrokPromptBuilder.MAX_USERNAME_LENGTH);

    // Remove @ symbol if present at the start
    if (sanitized.startsWith('@')) {
      sanitized = sanitized.slice(1);
    }

    return sanitized as SanitizedUsername;
  }

  /**
   * Validate that a prompt doesn't exceed token limits
   * @param prompt - The prompt to validate
   * @param maxLength - Maximum allowed length (characters as proxy for tokens)
   * @returns True if valid, false otherwise
   */
  validatePromptLength(prompt: string, maxLength: number = 100000): boolean {
    return prompt.length <= maxLength;
  }

  /**
   * Estimate token count for a prompt (rough approximation)
   * @param prompt - The prompt to estimate
   * @returns Estimated token count
   */
  estimateTokenCount(prompt: string): number {
    // Rough estimation: ~4 characters per token on average
    return Math.ceil(prompt.length / 4);
  }

  /**
   * Build a custom prompt with sanitization
   * @param systemPrompt - System instruction
   * @param userInput - User input (will be sanitized)
   * @returns Object containing sanitized prompts
   */
  buildCustomPrompt(
    systemPrompt: string,
    userInput: string
  ): {
    systemPrompt: string;
    userPrompt: string;
  } {
    // Sanitize user input to prevent injection
    const sanitizedInput = this.sanitizeUserInput(userInput);

    return {
      systemPrompt,
      userPrompt: sanitizedInput,
    };
  }

  /**
   * Sanitize general user input
   * @param input - Raw user input
   * @returns Sanitized input
   */
  private sanitizeUserInput(input: string): string {
    let sanitized = input;

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Apply injection prevention patterns
    for (const { pattern, replacement } of GrokPromptBuilder.INJECTION_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
    }

    return sanitized;
  }
}
