'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  getProgressPhase,
  getRandomMessage,
} from '@/features/vibe-analysis/config/progress-messages';

interface CircularProgressFullscreenProps {
  progress: number;
  className?: string;
  onComplete?: () => void;
  completionDelay?: number;
}

export function CircularProgressFullscreen({
  progress,
  className,
  onComplete,
  completionDelay = 500,
}: CircularProgressFullscreenProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const lastPhaseRef = useRef<string>('');
  const completionTriggeredRef = useRef(false);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Memoized SVG calculations
  const { size, strokeWidth, radius, circumference, strokeDashoffset } = useMemo(() => {
    const s = 320;
    const sw = 10;
    const r = (s - sw) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(Math.max(displayProgress, 0), 100) / 100) * c;
    return { size: s, strokeWidth: sw, radius: r, circumference: c, strokeDashoffset: offset };
  }, [displayProgress]);

  // Update message when phase changes
  useEffect(() => {
    const phase = getProgressPhase(progress);
    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase;
      setCurrentMessage(getRandomMessage(phase));
    }
  }, [progress]);

  // Smooth progress animation using requestAnimationFrame
  useEffect(() => {
    const targetProgress = Math.min(Math.max(progress, 0), 100);
    const startProgress = displayProgress;
    const startTime = performance.now();
    const duration = 300; // Animation duration in ms

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      const newProgress = startProgress + (targetProgress - startProgress) * easedProgress;
      setDisplayProgress(newProgress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [progress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Call onComplete when reaching 100% (with race condition fix)
  useEffect(() => {
    if (displayProgress >= 100 && onComplete && !completionTriggeredRef.current) {
      completionTriggeredRef.current = true;
      const timer = setTimeout(() => {
        onComplete();
      }, completionDelay);
      return () => clearTimeout(timer);
    }
  }, [displayProgress, onComplete, completionDelay]);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-gradient-to-br from-[#0A0A0A] via-[#1A0A2E] to-[#0A0A0A]',
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(displayProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading progress"
      aria-live="polite"
    >
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" aria-hidden="true" />

      {/* Main container - fixed positioning to prevent movement */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
        aria-hidden="true"
      >
        <div className="flex flex-col items-center justify-center space-y-12">
          {/* Circular Progress */}
          <div className="relative">
            {/* Glass morphism background card */}
            <div className="absolute inset-0 -m-8 rounded-full bg-white/5 backdrop-blur-md" />

            <svg
              className="relative -rotate-90 transform"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
            >
              <defs>
                {/* Gradient for progress stroke */}
                <linearGradient id="vibeProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.71 0.25 328)" stopOpacity="1" />
                  <stop offset="50%" stopColor="oklch(0.75 0.22 315)" stopOpacity="1" />
                  <stop offset="100%" stopColor="oklch(0.79 0.20 305)" stopOpacity="1" />
                </linearGradient>

                {/* Glow filter */}
                <filter id="vibeGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background track with glass effect */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
                fill="transparent"
                className="drop-shadow-lg"
              />

              {/* Inner track glow */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius - strokeWidth / 2}
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth={strokeWidth / 2}
                fill="transparent"
              />

              {/* Progress stroke with gradient and glow */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#vibeProgressGradient)"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                filter={prefersReducedMotion ? undefined : 'url(#vibeGlow)'}
                style={{
                  filter: prefersReducedMotion
                    ? undefined
                    : `drop-shadow(0 0 20px oklch(0.71 0.25 328 / ${Math.min(displayProgress / 100 + 0.3, 0.8)}))`,
                }}
              />

              {/* Animated pulse ring when nearing completion */}
              {displayProgress > 90 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="url(#vibeProgressGradient)"
                  strokeWidth={2}
                  fill="transparent"
                  opacity={0.3}
                  className={prefersReducedMotion ? '' : 'animate-ping'}
                />
              )}
            </svg>

            {/* Center content with glass card - fixed dimensions */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <div className="flex h-full flex-col items-center justify-center">
                  {/* Large percentage display */}
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white tabular-nums" aria-live="off">
                      {Math.round(displayProgress).toString().padStart(3, ' ')}
                    </span>
                    <span className="ml-1 text-sm text-white/70" aria-label="percent">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status message with animated glass card */}
          <div className="relative">
            <div className="rounded-full border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md transition-all duration-1000">
              <p
                className="flex items-center justify-center text-center text-base font-medium text-white/90 md:text-lg"
                role="status"
              >
                <span>{currentMessage}</span>
                <span className="ml-1 inline-flex" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        'mx-0.5 text-white/60',
                        prefersReducedMotion ? 'opacity-60' : `loading-dot loading-dot-${i + 1}`
                      )}
                    >
                      .
                    </span>
                  ))}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
