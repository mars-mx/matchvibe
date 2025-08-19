'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserValuesChart } from './user-values-chart';

interface DotPlotMetricProps {
  label: string;
  value1: number | null;
  value2: number | null;
  user1Name?: string;
  user2Name?: string;
  showAnimation?: boolean;
  delay?: number;
  className?: string;
  enableTooltip?: boolean;
}

export function DotPlotMetric({
  label,
  value1,
  value2,
  user1Name,
  user2Name,
  showAnimation = true,
  delay = 0,
  className,
  enableTooltip = true,
}: DotPlotMetricProps) {
  // Calculate similarity (1 = identical, 0 = completely different)
  const calculateSimilarity = (): number | null => {
    if (value1 === null || value2 === null) return null;
    const difference = Math.abs(value1 - value2);
    return 1 - difference;
  };

  const similarity = calculateSimilarity();
  const [displayPosition, setDisplayPosition] = useState(
    showAnimation ? 50 : (similarity ?? 0.5) * 100
  );
  const [isVisible, setIsVisible] = useState(!showAnimation);

  useEffect(() => {
    if (!showAnimation || similarity === null) {
      if (similarity !== null) {
        setDisplayPosition(similarity * 100);
      }
      setIsVisible(true);
      return;
    }

    // Fade in with delay
    const fadeInTimer = setTimeout(() => {
      setIsVisible(true);

      // Animate dot position
      const animationDuration = 1200;
      const startTime = performance.now();
      const targetPosition = similarity * 100;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Use easeOutQuad for smooth deceleration
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const currentPosition = 50 + (targetPosition - 50) * easeOutQuad;

        setDisplayPosition(currentPosition);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayPosition(targetPosition);
        }
      };

      requestAnimationFrame(animate);
    }, 500 + delay);

    return () => {
      clearTimeout(fadeInTimer);
    };
  }, [similarity, showAnimation, delay]);

  if (similarity === null) {
    return null;
  }

  // Get color based on similarity
  const getColorClasses = () => {
    if (displayPosition >= 80) return 'bg-green-500 shadow-green-500/50';
    if (displayPosition >= 60) return 'bg-blue-500 shadow-blue-500/50';
    if (displayPosition >= 40) return 'bg-yellow-500 shadow-yellow-500/50';
    if (displayPosition >= 20) return 'bg-orange-500 shadow-orange-500/50';
    return 'bg-red-500 shadow-red-500/50';
  };

  const getTextColor = () => {
    if (displayPosition >= 80) return 'text-green-400';
    if (displayPosition >= 60) return 'text-blue-400';
    if (displayPosition >= 40) return 'text-yellow-400';
    if (displayPosition >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  const content = (
    <div
      className={cn(
        'space-y-2 transition-opacity duration-500',
        enableTooltip && user1Name && user2Name ? 'cursor-help' : '',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span
          className={cn('font-medium tabular-nums transition-colors duration-300', getTextColor())}
        >
          {Math.round(displayPosition)}%
        </span>
      </div>

      <div className="relative h-2">
        {/* Track */}
        <div className="absolute inset-0 rounded-full bg-white/10" />

        {/* Scale markers */}
        <div className="absolute inset-0 flex items-center">
          <div className="absolute left-0 h-1 w-px bg-white/20" />
          <div className="absolute left-1/4 h-1 w-px bg-white/10" />
          <div className="absolute left-1/2 h-1 w-px bg-white/10" />
          <div className="absolute left-3/4 h-1 w-px bg-white/10" />
          <div className="absolute right-0 h-1 w-px bg-white/20" />
        </div>

        {/* Dot */}
        <div
          className={cn(
            'absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-all duration-1000 ease-out',
            'shadow-lg',
            getColorClasses()
          )}
          style={{
            left: `${displayPosition}%`,
            transform: `translateX(-50%) translateY(-50%)`,
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-white/40">
        <span>Different</span>
        <span>Similar</span>
      </div>
    </div>
  );

  // If tooltip is enabled and we have user names, wrap with tooltip
  if (enableTooltip && user1Name && user2Name) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            className="w-[180px] border border-white/20 bg-white/10 p-3.5 shadow-2xl backdrop-blur-xl"
          >
            <UserValuesChart
              user1Name={user1Name}
              user2Name={user2Name}
              value1={value1}
              value2={value2}
            />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
