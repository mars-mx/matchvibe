import { cn } from '@/lib/utils';

interface VibeSkeletonProps {
  className?: string;
}

// Custom breathing skeleton component with shimmer effect
function BreathingSkeleton({
  className,
  subtle = false,
  delay = 0,
  ...props
}: React.ComponentProps<'div'> & { subtle?: boolean; delay?: number }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-white/10',
        subtle
          ? 'animate-[breathing-subtle_4s_ease-in-out_infinite]'
          : 'animate-[breathing_3s_ease-in-out_infinite]',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-y-0 -left-full w-full animate-[shimmer_2s_linear_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
        style={{
          animationDelay: `${delay}ms`,
          width: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
        }}
      />
    </div>
  );
}

export function VibeSkeleton({ className }: VibeSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-in fade-in-0 mx-auto w-full max-w-5xl flex-1 space-y-4 duration-500 md:flex md:flex-col md:space-y-3',
        className
      )}
    >
      {/* Score and Summary Row */}
      <div className="space-y-4 md:flex md:gap-4 md:space-y-0">
        {/* Score Card Skeleton - Smaller on desktop */}
        <div className="animate-[breathing-card_4s_ease-in-out_infinite] rounded-lg border border-white/20 bg-white/10 p-5 backdrop-blur-sm md:w-2/5 md:p-6">
          <div className="flex flex-col items-center space-y-3">
            {/* Large Score Number */}
            <BreathingSkeleton className="h-16 w-24 md:h-20 md:w-32" delay={0} />
            {/* Score out of 100 */}
            <BreathingSkeleton className="h-4 w-12 md:h-5 md:w-16" subtle delay={200} />
            {/* Progress Bar */}
            <div className="w-full">
              <BreathingSkeleton className="h-2 w-full rounded-full" delay={400} />
            </div>
            {/* Compatibility Text */}
            <BreathingSkeleton className="h-4 w-36 md:h-5 md:w-44" subtle delay={600} />
            {/* Based on text */}
            <BreathingSkeleton className="h-3 w-48 md:h-4 md:w-56" subtle delay={800} />
          </div>
        </div>

        {/* Analysis Summary Skeleton - Beside score on desktop */}
        <div
          className="animate-[breathing-card_4s_ease-in-out_infinite] rounded-lg border border-white/20 bg-white/10 p-5 backdrop-blur-sm md:flex-1 md:p-6"
          style={{ animationDelay: '200ms' }}
        >
          <BreathingSkeleton className="mb-4 h-6 w-44 md:mb-4 md:h-7 md:w-52" delay={0} />
          <div className="space-y-2 md:space-y-2.5">
            {/* Multiple lines of text simulating a paragraph */}
            <BreathingSkeleton className="h-3.5 w-full md:h-4" subtle delay={100} />
            <BreathingSkeleton className="h-3.5 w-full md:h-4" subtle delay={150} />
            <BreathingSkeleton className="h-3.5 w-4/5 md:h-4" subtle delay={200} />
            <BreathingSkeleton className="h-3.5 w-full md:h-4" subtle delay={250} />
            <BreathingSkeleton className="h-3.5 w-full md:h-4" subtle delay={300} />
            <BreathingSkeleton className="h-3.5 w-3/4 md:h-4" subtle delay={350} />
            <BreathingSkeleton className="h-3.5 w-full md:h-4" subtle delay={400} />
            <BreathingSkeleton className="h-3.5 w-5/6 md:h-4" subtle delay={450} />
          </div>
        </div>
      </div>

      {/* Breakdown Grid Skeleton - More compact */}
      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        {/* Strengths */}
        <div
          className="animate-[breathing-card_4s_ease-in-out_infinite] rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:p-5"
          style={{ animationDelay: '400ms' }}
        >
          <BreathingSkeleton className="mb-3 h-5 w-24 text-green-400 md:mb-3 md:h-5" delay={0} />
          <div className="space-y-2 md:space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <BreathingSkeleton
                  className="mt-0.5 h-3.5 w-3.5 rounded-full md:h-4 md:w-4"
                  subtle
                  delay={i * 200}
                />
                <div className="flex-1 space-y-1">
                  <BreathingSkeleton className="h-3.5 w-full md:h-4" subtle delay={i * 200 + 50} />
                  <BreathingSkeleton className="h-3.5 w-4/5 md:h-4" subtle delay={i * 200 + 100} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Challenges */}
        <div
          className="animate-[breathing-card_4s_ease-in-out_infinite] rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:p-5"
          style={{ animationDelay: '600ms' }}
        >
          <BreathingSkeleton className="mb-3 h-5 w-28 text-yellow-400 md:mb-3 md:h-5" delay={0} />
          <div className="space-y-2 md:space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <BreathingSkeleton
                  className="mt-0.5 h-3.5 w-3.5 rounded-full md:h-4 md:w-4"
                  subtle
                  delay={i * 200}
                />
                <div className="flex-1 space-y-1">
                  <BreathingSkeleton className="h-3.5 w-full md:h-4" subtle delay={i * 200 + 50} />
                  <BreathingSkeleton className="h-3.5 w-3/4 md:h-4" subtle delay={i * 200 + 100} />
                  {i === 0 && (
                    <BreathingSkeleton
                      className="h-3.5 w-1/2 md:h-4"
                      subtle
                      delay={i * 200 + 150}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shared Interests */}
        <div
          className="animate-[breathing-card_4s_ease-in-out_infinite] rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:p-5"
          style={{ animationDelay: '800ms' }}
        >
          <BreathingSkeleton className="mb-3 h-5 w-32 text-blue-400 md:mb-3 md:h-5" delay={0} />
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            <BreathingSkeleton className="h-6 w-24 rounded-full md:h-7 md:w-28" subtle delay={0} />
            <BreathingSkeleton
              className="h-6 w-28 rounded-full md:h-7 md:w-32"
              subtle
              delay={100}
            />
          </div>
        </div>
      </div>

      {/* Share Section Skeleton - Compact */}
      <div
        className="animate-[breathing-card_4s_ease-in-out_infinite] rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:p-5"
        style={{ animationDelay: '1000ms' }}
      >
        <div className="flex items-center justify-between">
          <BreathingSkeleton className="h-4 w-32 md:h-4 md:w-36" delay={0} />
          <div className="flex gap-2">
            <BreathingSkeleton className="h-9 w-9 rounded-md md:h-10 md:w-10" delay={100} />
            <BreathingSkeleton className="h-9 w-9 rounded-md md:h-10 md:w-10" delay={200} />
            <BreathingSkeleton className="h-9 w-24 rounded-md md:h-10 md:w-28" delay={300} />
          </div>
        </div>
      </div>
    </div>
  );
}
