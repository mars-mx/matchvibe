module.exports = {
  // TypeScript files
  '*.{ts,tsx}': ['prettier --write', 'eslint --fix', () => 'tsc --noEmit --skipLibCheck'],

  // JavaScript files
  '*.{js,jsx,mjs}': ['prettier --write', 'eslint --fix'],

  // CSS files
  '*.css': ['prettier --write'],

  // JSON, Markdown, and other files
  '*.{json,md,mdx,yml,yaml}': ['prettier --write'],
};
