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

# Fix linting issues
npm run lint:fix

# Check code formatting
npm run format

# Fix formatting issues
npm run format:fix

# Run TypeScript type checking
npm run typecheck
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
- **ESLint**: Flat config with Next.js core-web-vitals, TypeScript rules, and Prettier integration
- **Tailwind CSS v4**: Uses `@theme inline` directive with CSS custom properties
- **Prettier**: Code formatting with Tailwind CSS plugin for class sorting
- **Husky & lint-staged**: Pre-commit hooks for automatic linting and formatting
- **Commitlint**: Enforces conventional commit messages

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

### Code Quality & Pre-commit Workflow

#### Pre-commit Hooks

This project uses Husky and lint-staged to automatically run checks before commits:

- **Formatting**: Prettier formats all staged files
- **Linting**: ESLint fixes auto-fixable issues
- **Type Checking**: TypeScript compiler validates types
- **Commit Messages**: Commitlint enforces conventional commit format

#### Commit Message Convention

Follow the conventional commits specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or dependencies
- `ci`: CI/CD configuration
- `chore`: Maintenance tasks
- `revert`: Revert a previous commit

Examples:

```bash
feat: add user authentication
fix(api): handle null response from X API
docs: update README with setup instructions
```

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
