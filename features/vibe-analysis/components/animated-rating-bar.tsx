'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AnimatedRatingBarProps {
  label: string;
  value: number; // 0-1 or 0-100
  showAnimation?: boolean;
  delay?: number; // Animation delay in ms
  className?: string;
}

export function AnimatedRatingBar({
  label,
  value,
  showAnimation = true,
  delay = 0,
  className,
}: AnimatedRatingBarProps) {
  // Normalize value to 0-100 if it's 0-1
  const normalizedValue = value <= 1 ? value * 100 : value;
  const [displayValue, setDisplayValue] = useState(showAnimation ? 0 : normalizedValue);
  const [isVisible, setIsVisible] = useState(!showAnimation);

  useEffect(() => {
    if (!showAnimation) {
      setDisplayValue(normalizedValue);
      setIsVisible(true);
      return;
    }

    // Fade in with delay
    const fadeInTimer = setTimeout(() => {
      setIsVisible(true);

      // Animate value
      const animationDuration = 1200;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Use easeOutQuad for smooth deceleration
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const currentValue = Math.round(normalizedValue * easeOutQuad);

        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(normalizedValue);
        }
      };

      requestAnimationFrame(animate);
    }, 500 + delay); // Base delay + stagger delay

    return () => {
      clearTimeout(fadeInTimer);
    };
  }, [normalizedValue, showAnimation, delay]);

  // Color based on value
  const getColorClass = () => {
    if (displayValue >= 80) return 'bg-primary';
    if (displayValue >= 60) return 'bg-primary/80';
    if (displayValue >= 40) return 'bg-primary/60';
    return 'bg-primary/40';
  };

  return (
    <div
      className={cn(
        'space-y-1.5 transition-opacity duration-500',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-medium text-white/90 tabular-nums">{displayValue}%</span>
      </div>
      <Progress
        value={displayValue}
        className="h-1.5 bg-white/10"
        indicatorClassName={cn('transition-all duration-1000 ease-out', getColorClass())}
      />
    </div>
  );
}
