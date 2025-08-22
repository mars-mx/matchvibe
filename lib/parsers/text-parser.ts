/**
 * Text parsing utilities for converting plain text with special patterns
 * into structured data for rendering
 */

export interface TextSegment {
  type: 'text' | 'handle';
  content: string;
  username?: string;
}

/**
 * Parses text to identify X (Twitter) handles (@username) and returns
 * an array of segments for rendering with links
 *
 * @param text - The text to parse
 * @returns Array of text segments with identified handles
 *
 * @example
 * parseTextWithHandles("Check out @elonmusk and @sama")
 * // Returns:
 * // [
 * //   { type: 'text', content: 'Check out ' },
 * //   { type: 'handle', content: '@elonmusk', username: 'elonmusk' },
 * //   { type: 'text', content: ' and ' },
 * //   { type: 'handle', content: '@sama', username: 'sama' }
 * // ]
 */
export function parseTextWithHandles(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const handleRegex = /@(\w+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = handleRegex.exec(text)) !== null) {
    // Add text before the handle if there is any
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add the handle
    segments.push({
      type: 'handle',
      content: match[0], // Full match including @
      username: match[1], // Just the username part
    });

    lastIndex = handleRegex.lastIndex;
  }

  // Add any remaining text after the last handle
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}
