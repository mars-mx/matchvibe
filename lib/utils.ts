import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NextRequest } from 'next/server';
import { ValidationError } from '@/shared/lib/errors';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parse JSON from request with size limits and validation
 * @param request - The Next.js request object
 * @returns Parsed JSON object
 */
export async function parseJsonSafely(request: NextRequest): Promise<unknown> {
  const MAX_BODY_SIZE = 1024 * 10; // 10KB limit

  try {
    // Get the raw body first to check size
    const text = await request.text();

    // Check body size
    if (text.length > MAX_BODY_SIZE) {
      throw new ValidationError(`Request body too large. Maximum size is ${MAX_BODY_SIZE} bytes.`, {
        code: 'BODY_TOO_LARGE',
        field: 'body',
      });
    }

    // Check for empty body
    if (!text.trim()) {
      throw new ValidationError('Request body is empty', { code: 'EMPTY_BODY', field: 'body' });
    }

    // Parse JSON with additional safety
    const parsed = JSON.parse(text);

    // Basic type validation
    if (typeof parsed !== 'object' || parsed === null) {
      throw new ValidationError('Request body must be a valid JSON object', {
        code: 'INVALID_JSON_TYPE',
        field: 'body',
      });
    }

    return parsed;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON format in request body', {
        code: 'INVALID_JSON_SYNTAX',
        field: 'body',
      });
    }

    // Re-throw other errors
    throw error;
  }
}
