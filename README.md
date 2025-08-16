# MatchVibe

MatchVibe is an open-source tool to analyze compatibility between X users with a vibe score (0-100) based on posting style, topics, and interactions. Built with Next.js, App Router, and Shadcn components, it’s deployed on Vercel for seamless access.

- **Live Demo**: [matchvibe.app](https://matchvibe.app)
- **Twitter**: [@marsc_hb](https://x.com/marsc_hb), [@richkuo7](https://x.com/richkuo7/status/1956646684358029557)
- **License**: MIT (see LICENSE)

## Features

- Compare X user vibes using AI-driven analysis.
- Open-source and community-driven.
- Responsive UI with Shadcn components.

## Tech Stack

- **Framework**: Next.js with App Router
- **Components**: Shadcn/UI
- **Deployment**: Vercel
- **Language**: TypeScript
- **Code Quality**: ESLint, Prettier, Husky, Commitlint

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

Create a `.env.local` file with:

```
NEXT_PUBLIC_API_KEY=your_x_api_key
```

## Deployment

Deploy to Vercel with one click:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%mars-mx%2Fmatchvibe)

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Inspired by [@marsc_hb](https://x.com/marsc_hb) and [@richkuo7](https://x.com/richkuo7/status/1956646684358029557)'s collaboration.
- Built with love using Next.js, Shadcn, and the open-source community.

## Stay Connected

Follow [@marsc_hb](https://x.com/marsc_hb) and [@richkuo7](https://x.com/richkuo7) for updates!
