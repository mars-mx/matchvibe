import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Hero() {
  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden px-6">
      <div className="gradient-bg absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm">
          <span className="bg-primary mr-2 h-2 w-2 rounded-full"></span>X Vibe Matching AI
        </div>

        <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          The <span className="gradient-text">Vibe Compatibility</span> Framework
        </h1>

        <div className="mx-auto mb-10 max-w-2xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-3">
            <div className="relative flex flex-1 items-center rounded-md border border-white/20 bg-white/10 opacity-60 backdrop-blur-sm">
              <span className="pr-1 pl-3 text-white/70 select-none">@</span>
              <Input
                type="text"
                placeholder="marsc_hb"
                disabled
                aria-label="First username input - Coming soon"
                aria-disabled="true"
                aria-describedby="feature-coming-soon"
                className="border-0 bg-transparent text-white shadow-none placeholder:text-white/50 focus-visible:ring-0"
              />
            </div>

            <div className="relative flex flex-1 items-center rounded-md border border-white/20 bg-white/10 opacity-60 backdrop-blur-sm">
              <span className="pr-1 pl-3 text-white/70 select-none">@</span>
              <Input
                type="text"
                placeholder="richkuo7"
                disabled
                aria-label="Second username input - Coming soon"
                aria-disabled="true"
                aria-describedby="feature-coming-soon"
                className="border-0 bg-transparent text-white shadow-none placeholder:text-white/50 focus-visible:ring-0"
              />
            </div>

            <Button
              size="lg"
              disabled
              aria-label="Analyze vibe match - Coming soon"
              aria-disabled="true"
              aria-describedby="feature-coming-soon"
              className="bg-primary/50 text-primary-foreground min-w-[140px] cursor-not-allowed sm:flex-shrink-0"
            >
              Coming Soon
            </Button>
          </div>
        </div>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70 sm:text-xl">
          Tired of repetitive timelines filled with AI-generated content? Verify authentic
          connections before you follow.
        </p>

        <span id="feature-coming-soon" className="sr-only">
          This feature is coming soon. The vibe matching functionality is currently under
          development.
        </span>
      </div>
    </section>
  );
}
