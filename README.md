# MatchVibe

MatchVibe is an open-source tool to analyze compatibility between X users with a vibe score (0-100) based on posting style, topics, and interactions. Built with Next.js, App Router, and Shadcn components, it’s deployed on Vercel for seamless access.

- **Live Demo**: [matchvibe.app](https://matchvibe.app)
- **X**: [@marsc_hb](https://x.com/marsc_hb), [@richkuo7](https://x.com/richkuo7)
- **License**: MIT (see LICENSE.md)

## Features

- Compare X user vibes using AI-driven analysis.
- Open-source and community-driven.
- Responsive UI with Shadcn components.
- Rate limiting protection (20 requests per 10 minutes).
- Bot detection and protection.
- Secure API with request validation.

## Tech Stack

- **Framework**: Next.js with App Router
- **Components**: Shadcn/UI
- **Deployment**: Vercel
- **Language**: TypeScript
- **Code Quality**: ESLint, Prettier, Husky, Commitlint
- **Security**: Rate limiting with Upstash Redis, Bot protection
- **AI**: Grok API for vibe analysis

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/mars-mx/matchvibe
   cd matchvibe
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run locally:
   ```bash
   npm run dev
   ```

### Development Scripts

```bash
# Run development server
npm run dev

# Build for production
npm run build

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

# Add shadcn components
npx shadcn@latest add [component-name]

# Add multiple shadcn components
npx shadcn@latest add button card input

# Browse and select components interactively
npx shadcn@latest add
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Required for API functionality
GROK_API_KEY=xai-your-api-key-here

# Optional for local development (rate limiting disabled by default)
RATE_LIMIT_ENABLED=false  # Set to true to test rate limiting locally

# Required for production (auto-configured via Vercel Marketplace)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

**Note**: Rate limiting is automatically disabled in local development. No Redis setup needed for local testing!

## Deployment

### Quick Deploy

Deploy to Vercel with one click:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%mars-mx%2Fmatchvibe)

### Production Setup

1. **Deploy to Vercel** using the button above
2. **Configure environment variables**:
   - Add `GROK_API_KEY` in Vercel dashboard
3. **Setup Upstash Redis** (for rate limiting):
   - Go to your Vercel project → Storage tab
   - Click "Connect Store" → Select "Upstash"
   - Create a Redis database (free tier: 10,000 requests/day)
   - Environment variables are auto-configured!

### Security Features

- **Rate Limiting**: 20 requests per 10-minute window per IP
- **Token Bucket Algorithm**: Allows burst traffic with controlled average rate
- **Bot Protection**: Blocks malicious automated traffic
- **Request Validation**: Strict input validation with Zod schemas

## Contributing

We welcome contributions! Please:

- Fork the repo and create a feature branch.
- Submit a PR with a clear description.
- Follow the [Contributing Guidelines](CONTRIBUTING.md).

### Code Quality

This project uses automated code quality tools:

- **Pre-commit hooks**: Automatically format and lint code before commits
- **Conventional commits**: Follow the format `type(scope): message`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
  - Example: `feat: add user authentication`
- **TypeScript**: Strict mode enabled for type safety
- **ESLint & Prettier**: Consistent code style and formatting

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

- Inspired by [@marsc_hb](https://x.com/marsc_hb) and [@richkuo7](https://x.com/richkuo7)'s collaboration.
- Built with love using Next.js, Shadcn, and the open-source community.

## Stay Connected

Follow [@marsc_hb](https://x.com/marsc_hb) and [@richkuo7](https://x.com/richkuo7) for updates!
