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

# Add shadcn/ui components
npx shadcn@latest add [component-name]

# Add multiple components
npx shadcn@latest add button card input

# Browse components interactively
npx shadcn@latest add
```

## Architecture

### Tech Stack

- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with PostCSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono
- **Security**: Rate limiting (Upstash Redis), Bot protection (BotId)
- **AI Integration**: Grok API for vibe analysis

### Project Structure

- `/app` - App Router pages and layouts (no `/src` directory)
- `/public` - Static assets
- `/lib` - Utility functions and shadcn utils
  - `/lib/security` - Security middleware (rate limiting, bot protection)
  - `/lib/validations` - Zod schemas for validation
- `/components` - React components
- `/components/ui` - shadcn/ui components
- `/features` - Feature-specific modules (vibe-analysis)
- `/shared` - Shared utilities and error handling

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
- shadcn/ui theming with CSS variables
- Theme colors: `--color-background`, `--color-foreground`, etc.
- Component styling via `cn()` utility from `/lib/utils`

### TypeScript Requirements

- Strict mode enforced - always provide proper types
- Use path alias `@/` for imports from project root

### shadcn/ui Component Usage

- Components are copied into `/components/ui` directory
- Import components using: `import { Button } from '@/components/ui/button'`
- Components are fully customizable - modify them as needed
- Use `cn()` utility from `/lib/utils` for conditional styling
- Available components: Button, Input, Label, Separator, Card, Badge
- Add new components with: `npx shadcn@latest add [component-name]`

### Validation Strategy

MatchVibe uses Zod (v4) for comprehensive runtime validation:

#### Schema Organization

```
features/vibe-analysis/schemas/
├── request.schema.ts   # Request validation (usernames, analysis depth)
├── response.schema.ts  # Response validation (results, errors, API responses)
└── index.ts           # Central exports with type inference

lib/validations/
└── env.schema.ts      # Environment variable validation
```

#### Usage Examples

```typescript
// Validate API requests
import { vibeAnalysisRequestSchema } from '@/features/vibe-analysis/schemas';
const validated = vibeAnalysisRequestSchema.parse(body);

// Validate external API responses
import { grokAPIResponseSchema } from '@/features/vibe-analysis/schemas';
const data = grokAPIResponseSchema.parse(rawResponse);

// Environment validation (at startup)
import { validateEnv } from '@/lib/validations/env.schema';
const env = validateEnv(); // Fails fast with clear errors
```

#### Benefits

- **Runtime safety**: Catch malformed data before it crashes the app
- **Type inference**: Zod schemas automatically provide TypeScript types
- **Clear errors**: Detailed validation messages for debugging
- **External API protection**: Validate third-party responses before use

### Security Infrastructure

#### Rate Limiting

Implemented using Upstash Redis with token bucket algorithm:

- **Default Limits**: 20 requests per 10-minute window
- **Algorithm**: Token bucket for burst tolerance
- **Identification**: IP-based using proxy headers
- **Local Development**: Disabled by default (no Redis needed)
- **Production**: Auto-configured via Vercel Marketplace

#### Middleware Execution Order

```typescript
// Optimal order for performance and security
export const POST = withRateLimit(
  // 1. Rate limit (cheap, fast)
  withBotProtection(
    // 2. Bot protection (expensive)
    async (request) => {
      // 3. Handler logic
      // API implementation
    }
  )
);
```

#### Bot Protection

- Uses BotId library for detection
- Blocks malicious automated traffic
- Allows verified bots (Google, Bing, etc.)
- Configurable blocking messages

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

1. ~~UI component library (Shadcn) integration~~ ✅ Complete
2. ~~Rate limiting and bot protection~~ ✅ Complete
3. X API integration for user fetching
4. Vibe analysis algorithm implementation
5. Results UI with score visualization
6. Share functionality
7. Error handling and edge cases

## Environment Variables

### Required

- `GROK_API_KEY` - Grok API key for AI analysis (starts with `xai-`)

### Optional (Local Development)

- `RATE_LIMIT_ENABLED` - Enable rate limiting (default: false in dev, true in prod)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 20)
- `RATE_LIMIT_WINDOW_MINUTES` - Time window in minutes (default: 10)
- `RATE_LIMIT_REFILL_RATE` - Tokens refilled per minute (default: 2)
- `RATE_LIMIT_BURST_CAPACITY` - Extra burst capacity (default: 5)

### Required (Production)

- `UPSTASH_REDIS_REST_URL` - Redis URL (auto-configured via Vercel Marketplace)
- `UPSTASH_REDIS_REST_TOKEN` - Redis token (auto-configured via Vercel Marketplace)

## Deployment

Configured for Vercel deployment with one-click deploy button in README.

### Production Setup

1. Deploy to Vercel
2. Add `GROK_API_KEY` environment variable
3. Connect Upstash Redis via Vercel Marketplace:
   - Go to Storage tab → Connect Store → Upstash
   - Create Redis database (free tier: 10k requests/day)
   - Environment variables auto-configured

## Testing Guidelines

### Local Development

- Rate limiting disabled by default
- No Redis setup required
- Set `RATE_LIMIT_ENABLED=true` to test rate limiting locally

### Testing Rate Limiting

```bash
# Test rate limit headers
curl -I http://localhost:3000/api/vibe/analyze

# Check headers:
# X-RateLimit-Limit: 20
# X-RateLimit-Remaining: 19
# X-RateLimit-Reset: 2025-01-16T10:30:00Z
```
