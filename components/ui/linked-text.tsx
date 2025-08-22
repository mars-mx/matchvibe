'use client';

import { useMemo } from 'react';
import { parseTextWithHandles, type TextSegment } from '@/lib/parsers/text-parser';
import { cn } from '@/lib/utils';

export interface LinkedTextProps {
  /**
   * The text content to parse and render with clickable handles
   */
  text: string;
  /**
   * Optional className for the paragraph wrapper
   */
  className?: string;
  /**
   * Optional className for the link elements
   */
  linkClassName?: string;
  /**
   * Optional base URL for handles (defaults to https://x.com/)
   */
  baseUrl?: string;
}

/**
 * Renders text with @ handles converted to clickable links to X (Twitter) profiles
 *
 * @example
 * <LinkedText
 *   text="Check out @elonmusk and @sama for interesting content"
 *   className="text-gray-700"
 *   linkClassName="text-blue-500 hover:underline"
 * />
 */
export function LinkedText({
  text,
  className,
  linkClassName,
  baseUrl = 'https://x.com/',
}: LinkedTextProps) {
  // Memoize the parsed segments to avoid re-parsing on every render
  const segments = useMemo(() => parseTextWithHandles(text), [text]);

  return (
    <p className={cn(className)}>
      {segments.map((segment: TextSegment, index: number) => {
        if (segment.type === 'handle' && segment.username) {
          return (
            <a
              key={index}
              href={`${baseUrl}${segment.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'text-primary hover:text-primary/80 transition-colors hover:underline',
                linkClassName
              )}
              aria-label={`View ${segment.content} on X`}
            >
              {segment.content}
            </a>
          );
        }

        return <span key={index}>{segment.content}</span>;
      })}
    </p>
  );
}
