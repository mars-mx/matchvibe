# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MatchVibe is an open-source tool for analyzing compatibility between X (Twitter) users using AI-driven vibe scoring (0-100). The application uses a two-tier Grok API architecture to fetch user profiles and analyze compatibility with glass morphism UI design.

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
- **Styling**: Tailwind CSS v4 with PostCSS, Glass morphism design
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono
- **Security**: Rate limiting (Upstash Redis), Bot protection (BotId)
- **AI Integration**: Two-tier Grok API architecture (profile fetching + analysis)
- **Error Handling**: Circuit breaker pattern, retry logic with exponential backoff
- **Performance**: Usage tracking, request caching

### Project Structure

- `/app` - App Router pages and layouts (no `/src` directory)
  - `/app/vibe/[user1]/[user2]` - Dynamic vibe analysis pages
- `/public` - Static assets
- `/lib` - Utility functions and shadcn utils
  - `/lib/security` - Security middleware (rate limiting, bot protection)
  - `/lib/validations` - Zod schemas for validation
  - `/lib/config` - Application constants and theme configuration
  - `/lib/parsers` - Text parsing utilities
- `/components` - React components
  - `/components/ui` - shadcn/ui components (including glass-input)
  - `/components/sections` - Page sections (Hero, VibeAnalysisForm, VibeAnalysisResults)
  - `/components/providers` - Context providers (BotId, SpeedInsights)
- `/features/vibe-analysis` - Vibe analysis feature module
  - `/components` - Feature-specific UI components
  - `/services` - Business logic and API integration
    - `/grok` - Modular Grok service architecture
    - `/transformers` - Data transformation utilities
  - `/schemas` - Zod validation schemas
  - `/config` - Feature constants and prompts
  - `/lib` - Feature utilities (API client, usage tracker)
- `/shared` - Shared utilities and error handling
- `/middleware.ts` - Edge middleware for rate limiting on /vibe/\* routes
- `/widgets` - Standalone widget components

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
- **Server Component First Architecture**: Direct service calls in Server Components instead of API routes
- Server Actions for form submissions with built-in rate limiting

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
- Available components: Button, Input, Label, Separator, Card, Badge, Alert, Progress, Skeleton, Sonner (toast), GlassInput, LinkedText
- Add new components with: `npx shadcn@latest add [component-name]`

### UI Design System

- **Glass Morphism**: Primary design pattern with backdrop blur and transparency
- **GlassInput Component**: Custom input with advanced autofill prevention and liquid glass effects
- **Animations**: Smooth transitions with Tailwind CSS animations
- **Loading States**: Skeleton screens and progress indicators for async operations
- **Toast Notifications**: Sonner integration for user feedback

### Validation Strategy

MatchVibe uses Zod (v4) for comprehensive runtime validation:

#### Schema Organization

```
features/vibe-analysis/schemas/
├── request.schema.ts   # Request validation (usernames, analysis depth)
├── response.schema.ts  # Response validation (results, errors, API responses)
├── profile.schema.ts   # X/Twitter profile data validation
└── index.ts           # Central exports with type inference

lib/validations/
└── env.schema.ts      # Environment variable validation with comprehensive checks
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

### Security Architecture (Server Component First)

#### Overview

MatchVibe uses a **Server Component First** architecture with security applied at multiple layers:

1. **Edge Middleware** (`/middleware.ts`): Rate limiting for `/vibe/*` routes
2. **Server Components**: Bot protection via BotId
3. **Server Actions**: Rate limiting wrapper for form submissions

#### Rate Limiting

Implemented using Upstash Redis with sliding window algorithm:

- **Default Limits**: 20 requests per 10-minute window
- **Algorithm**: Sliding window for consistent rate limiting
- **Identification**: IP-based using proxy headers
- **Local Development**: Disabled by default (no Redis needed)
- **Production**: Auto-configured via Vercel Marketplace

**Implementation Locations:**

- **Edge Middleware**: Protects `/vibe/*` routes
- **Server Actions**: Wrapped with `withServerActionRateLimit`

#### Bot Protection

- Uses Vercel BotId for detection
- Applied in Server Components (production only)
- Blocks malicious bots while allowing verified crawlers
- Returns 404 for blocked traffic to avoid revealing protection

#### Security Layers

```typescript
// 1. Edge Middleware (rate limiting)
// Applied automatically to /vibe/* routes via middleware.ts

// 2. Server Component (bot protection)
const botResult = await verifyBotId();
if (shouldBlockRequest(botResult)) {
  notFound();
}

// 3. Server Action (rate limiting)
export const action = withServerActionRateLimit(actionImpl, {
  errorMessage: 'Too many requests...',
});
```

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

## Grok Service Architecture

### Two-Tier Architecture

The vibe analysis uses a modular Grok service with two-tier architecture:

1. **Profile Fetching**: Retrieves X/Twitter user profiles via Grok API
2. **Compatibility Analysis**: Analyzes compatibility between two profiles

### Service Components

```
features/vibe-analysis/services/
├── grok/
│   ├── grok.service.ts         # Main service orchestrator
│   ├── grok-api-client.ts      # API communication layer
│   ├── grok-prompt-builder.ts  # Dynamic prompt generation
│   ├── grok-retry-manager.ts   # Retry logic with exponential backoff
│   └── grok-error-handler.ts   # Comprehensive error handling
├── transformers/
│   ├── profile.transformer.ts  # Profile data transformation
│   └── result.transformer.ts   # Result formatting
└── analyze.service.ts          # Main analysis orchestrator
```

### Key Features

- **Circuit Breaker Pattern**: Prevents cascading failures
- **Retry Logic**: Exponential backoff with jitter for transient failures
- **Usage Tracking**: Monitor API usage and costs
- **Request Caching**: Reduces duplicate API calls
- **Error Recovery**: Graceful degradation and fallback strategies

## Planned Features & TODOs

From README roadmap:

1. ~~UI component library (Shadcn) integration~~ ✅ Complete
2. ~~Rate limiting and bot protection~~ ✅ Complete
3. ~~Vibe analysis algorithm implementation~~ ✅ Complete
4. ~~Results UI with score visualization~~ ✅ Complete
5. ~~Glass morphism UI design~~ ✅ Complete
6. X API integration for user fetching (currently using Grok)
7. Share functionality (partially complete)
8. ~~Error handling and edge cases~~ ✅ Complete

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
# Test rate limit headers on vibe analysis pages
curl -I http://localhost:3000/vibe/user1/user2

# Check headers:
# X-RateLimit-Limit: 20
# X-RateLimit-Remaining: 19
# X-RateLimit-Reset: 2025-01-16T10:30:00Z
```

### Testing Grok Service

```bash
# Run the Grok service test script
npm run test:grok

# Or directly with TypeScript
npx tsx scripts/test-grok-service.ts
```

## Web Scraping Instructions

When you need to fetch content from a website and WebFetch fails or is unable to access it (like Reddit, Twitter, or other restricted sites), use the Firecrawl MCP tool instead:

```typescript
// If WebFetch fails with "unable to fetch from domain.com"
// Use Firecrawl instead:
mcp__firecrawl__firecrawl_scrape({
  url: 'https://example.com/page',
  formats: ['markdown'],
});
```

Firecrawl is more powerful and can access most websites that WebFetch cannot, including:

- Reddit posts and comments
- Twitter/X content
- Paywalled or restricted content
- JavaScript-heavy sites
- Sites with anti-bot protection

## AI Agent Commands

The project includes specialized AI agents configured in `.claude/commands/agents/` that can be used via the `/agent` command in Claude Code. These agents provide expert guidance for specific development tasks:

### Available Agents

#### System Architecture

- **system-architect** - Architectural decisions, code placement, patterns, and clean architecture enforcement
  - Use for: New feature planning, refactoring decisions, code reviews, dependency evaluation
  - Model: Sonnet

#### Frontend Development

- **react-nextjs-architect** - React components, Next.js patterns, state management, performance optimization
  - Use for: Component design, React best practices, Zustand/React Query integration, SSR/SSG optimization
  - Model: Sonnet

- **ui-ux-design-specialist** - Interface design, user experience, accessibility, responsive layouts
  - Use for: UI improvements, component styling, accessibility audits, mobile optimization
  - Model: Sonnet

#### Backend & Infrastructure

- **convex-backend-architect** - Convex database design, real-time features, backend architecture
  - Use for: Database schema design, real-time sync, Convex functions, data modeling
  - Model: Sonnet

- **vercel-deployment-specialist** - Deployment configuration, environment setup, CI/CD pipelines
  - Use for: Vercel config, build optimization, environment variables, edge functions
  - Model: Sonnet

#### Authentication & Payments

- **clerk-auth-specialist** - Clerk authentication, user management, permissions, security
  - Use for: Auth implementation, role-based access, session management, OAuth setup
  - Model: Sonnet

- **polar-payments-specialist** - Polar.sh payment integration, subscriptions, billing
  - Use for: Payment flow implementation, subscription tiers, webhook handling, billing logic
  - Model: Sonnet

#### Code Quality & Security

- **pair-programming-reviewer** - Code review, best practices, refactoring suggestions
  - Use for: Pull request reviews, code quality improvements, pattern suggestions
  - Model: Sonnet

- **security-auditor** - Security vulnerabilities, OWASP compliance, secure coding practices
  - Use for: Security audits, vulnerability assessment, encryption, secure API design
  - Model: Sonnet

- **debug-analyst** - Bug investigation, error analysis, systematic troubleshooting
  - Use for: Complex debugging, error pattern analysis, performance issues, root cause analysis
  - Model: Sonnet

#### Content & Marketing

- **conversion-copywriter** - Landing page copy, marketing content, CTA optimization
  - Use for: Homepage content, feature descriptions, marketing copy, A/B test variations
  - Model: Sonnet

### Usage Examples

```bash
# Get architectural guidance for a new feature
/agent system-architect "Design subscription management feature with Stripe"

# Review React component implementation
/agent react-nextjs-architect "Review the dashboard component for best practices"

# Debug a complex issue
/agent debug-analyst "API calls failing intermittently in production"

# Security audit before deployment
/agent security-auditor "Audit authentication flow for vulnerabilities"

# Optimize landing page conversion
/agent conversion-copywriter "Improve hero section copy for better conversion"
```

### Agent Capabilities

Each agent:

- Has deep expertise in their specific domain
- Follows 2025 best practices and latest framework versions
- Provides opinionated but well-reasoned guidance
- Can search documentation and research current patterns
- Offers concrete examples and implementation plans
- Does not write code directly but provides detailed specifications

### When to Use Agents

Use specialized agents when you need:

- **Expert guidance** on specific technologies or patterns
- **Architecture reviews** before implementing complex features
- **Code quality audits** with domain-specific expertise
- **Debugging assistance** for complex issues
- **Security assessments** with professional-level analysis
- **UI/UX recommendations** based on current best practices
- **Infrastructure optimization** for deployment and scaling
