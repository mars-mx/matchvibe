'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { getCompatibilityLevel } from '@/features/vibe-analysis/lib/api-client';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';

interface VibeScoreProps {
  score: number;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VibeScore({ score, showAnimation = true, size = 'md', className }: VibeScoreProps) {
  const [displayScore, setDisplayScore] = useState(showAnimation ? 0 : score);
  const [isVisible, setIsVisible] = useState(!showAnimation);
  const compatibility = getCompatibilityLevel(score);

  useEffect(() => {
    if (!showAnimation) {
      setDisplayScore(score);
      setIsVisible(true);
      return;
    }

    // First fade in the component
    const fadeInDelay = 300;
    const fadeInTimer = setTimeout(() => {
      setIsVisible(true);

      // Then start the score animation with constant rate
      const animationDuration = 1500;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Use easeOutQuad for smooth deceleration
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const currentScore = Math.round(score * easeOutQuad);

        setDisplayScore(currentScore);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayScore(score);
        }
      };

      requestAnimationFrame(animate);
    }, fadeInDelay);

    return () => {
      clearTimeout(fadeInTimer);
    };
  }, [score, showAnimation]);

  const getIcon = () => {
    switch (compatibility.level) {
      case 'perfect':
        return <Zap className="h-5 w-5" />;
      case 'high':
        return <TrendingUp className="h-5 w-5" />;
      case 'medium':
        return <Activity className="h-5 w-5" />;
      case 'low':
        return <TrendingDown className="h-5 w-5" />;
    }
  };

  const sizeClasses = {
    sm: {
      container: 'space-y-2',
      score: 'text-2xl',
      label: 'text-xs',
      progress: 'h-2',
    },
    md: {
      container: 'space-y-3',
      score: 'text-4xl',
      label: 'text-sm',
      progress: 'h-3',
    },
    lg: {
      container: 'space-y-4',
      score: 'text-6xl',
      label: 'text-base',
      progress: 'h-4',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={cn(
        classes.container,
        className,
        'transition-opacity duration-500',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className={cn('font-bold tabular-nums', classes.score, compatibility.color)}>
            {displayScore}
          </span>
          <span className={cn('text-muted-foreground', classes.label)}>/100</span>
        </div>
        <div className={cn('flex items-center gap-1', compatibility.color)}>
          {getIcon()}
          <span className={cn('font-medium', classes.label)}>{compatibility.label}</span>
        </div>
      </div>

      <Progress
        value={displayScore}
        className={cn(classes.progress, 'transition-all duration-300')}
        indicatorClassName={cn(
          'transition-all duration-1000 ease-out',
          compatibility.level === 'perfect' && 'bg-green-500',
          compatibility.level === 'high' && 'bg-blue-500',
          compatibility.level === 'medium' && 'bg-yellow-500',
          compatibility.level === 'low' && 'bg-red-500'
        )}
      />

      {size !== 'sm' && (
        <p className={cn('text-muted-foreground', classes.label)}>
          Based on {Math.floor(displayScore / 10 + 5)} shared interests and personality traits
        </p>
      )}
    </div>
  );
}
