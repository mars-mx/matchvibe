import { VibeAnalysisForm } from '@/features/vibe-analysis/components/vibe-analysis-form';

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div className="gradient-bg absolute inset-0" />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
          <span className="bg-primary mr-2 h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"></span>X Vibe
          Matching AI
        </div>

        {/* Title - Responsive sizing */}
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          The <span className="gradient-text">Vibe Compatibility</span> Framework
        </h1>

        {/* Analysis Form */}
        <VibeAnalysisForm />

        {/* Footer Text - Better mobile sizing */}
        <p className="mx-auto mt-8 max-w-2xl text-base text-white/70 sm:mt-10 sm:text-lg md:text-xl">
          Tired of repetitive timelines filled with AI-generated content? Verify authentic
          connections before you follow.
        </p>
      </div>
    </section>
  );
}
