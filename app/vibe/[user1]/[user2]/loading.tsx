import { VibeSkeleton } from '@/features/vibe-analysis/components/vibe-skeleton';

export default function Loading() {
  return (
    <section className="relative flex h-screen flex-col overflow-hidden md:overflow-hidden">
      <div className="gradient-bg absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col overflow-y-auto px-4 py-4 sm:px-6 md:overflow-y-auto md:py-6">
        {/* Header - Compact */}
        <div className="mb-4 flex-shrink-0 text-center md:mb-6">
          <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm md:mb-3 md:px-4 md:py-2 md:text-sm">
            <span className="bg-primary mr-2 h-1.5 w-1.5 animate-pulse rounded-full md:h-2 md:w-2"></span>
            Analyzing Vibe Compatibility...
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            <span className="gradient-text">Computing Vibe Match</span>
          </h1>
        </div>

        {/* Skeleton Components */}
        <VibeSkeleton />
      </div>
    </section>
  );
}
