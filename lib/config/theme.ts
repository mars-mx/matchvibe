/**
 * Theme configuration for consistent styling
 * Maps CSS variables and provides theme utilities
 */

/**
 * CSS variable mappings for Hero component styling
 * Avoids inline !important overrides
 */
export const heroThemeClasses = {
  vibeScore: [
    '[&_*]:text-white',
    '[&_.text-green-500]:text-green-400',
    '[&_.text-blue-500]:text-blue-400',
    '[&_.text-yellow-500]:text-yellow-400',
    '[&_.text-red-500]:text-red-400',
  ].join(' '),

  shareButton: [
    '[&_button]:bg-white/10',
    '[&_button]:text-white',
    '[&_button]:border-white/20',
    '[&_button:hover]:bg-white/20',
  ].join(' '),
} as const;

/**
 * Add these CSS rules to globals.css for proper theming:
 *
 * .vibe-score-hero {
 *   --color-text: white;
 *   --color-success: rgb(74 222 128);
 *   --color-info: rgb(96 165 250);
 *   --color-warning: rgb(250 204 21);
 *   --color-danger: rgb(248 113 113);
 * }
 *
 * .vibe-score-hero .text-green-500 { color: var(--color-success); }
 * .vibe-score-hero .text-blue-500 { color: var(--color-info); }
 * .vibe-score-hero .text-yellow-500 { color: var(--color-warning); }
 * .vibe-score-hero .text-red-500 { color: var(--color-danger); }
 *
 * .share-results-hero button {
 *   background-color: rgba(255, 255, 255, 0.1);
 *   color: white;
 *   border-color: rgba(255, 255, 255, 0.2);
 * }
 *
 * .share-results-hero button:hover {
 *   background-color: rgba(255, 255, 255, 0.2);
 * }
 */

/**
 * Theme variants for different contexts
 */
export const themeVariants = {
  hero: {
    background: 'bg-white/10',
    border: 'border-white/20',
    text: 'text-white',
    textMuted: 'text-white/70',
    textSubtle: 'text-white/50',
    backdrop: 'backdrop-blur-sm',
  },

  card: {
    background: 'bg-card',
    border: 'border',
    text: 'text-card-foreground',
    textMuted: 'text-muted-foreground',
    textSubtle: 'text-muted-foreground/70',
  },
} as const;

/**
 * Get theme classes for a specific variant and element
 */
export function getThemeClasses(
  variant: keyof typeof themeVariants,
  elements: Array<keyof (typeof themeVariants)[typeof variant]>
): string {
  const theme = themeVariants[variant];
  return elements.map((el) => theme[el]).join(' ');
}

export type ThemeVariant = keyof typeof themeVariants;
