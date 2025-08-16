# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MatchVibe is an open-source tool for analyzing compatibility between X (Twitter) users using AI-driven vibe scoring (0-100). Currently in early development stage with basic Next.js scaffolding.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Geist Sans & Geist Mono

### Project Structure
- `/app` - App Router pages and layouts (no `/src` directory)
- `/public` - Static assets
- `/lib` - Utility functions (when created)
- `/components` - React components (when created)

### Key Configurations
- **TypeScript**: Strict mode enabled, path alias `@/*` maps to project root
- **ESLint**: Flat config with Next.js core-web-vitals and TypeScript rules
- **Tailwind CSS v4**: Uses `@theme inline` directive with CSS custom properties

## Development Guidelines

### App Router Conventions
- Use `app/` directory structure
- Server Components by default, use `"use client"` directive for client components
- Metadata API for SEO
- Route handlers in `app/api/` directories

### Styling Approach
- Tailwind CSS v4 with custom properties
- Dark mode support via CSS variables
- Theme colors: `--color-background`, `--color-foreground`

### TypeScript Requirements
- Strict mode enforced - always provide proper types
- Use path alias `@/` for imports from project root

## Planned Features & TODOs

From README roadmap:
1. UI component library (Shadcn) integration
2. X API integration for user fetching
3. Vibe analysis algorithm implementation
4. Results UI with score visualization
5. Share functionality
6. Error handling and edge cases

## Environment Variables

Required for production:
- `NEXT_PUBLIC_API_KEY` - X API key for user data fetching

## Deployment

Configured for Vercel deployment with one-click deploy button in README.