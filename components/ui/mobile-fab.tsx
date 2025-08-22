'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface MobileFABProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  hideOnScroll?: boolean;
  offset?: number;
}

const MobileFAB = forwardRef<HTMLButtonElement, MobileFABProps>(
  ({ className, icon, position = 'bottom-right', offset = 16, children, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': `bottom-[${offset}px] right-[${offset}px]`,
      'bottom-left': `bottom-[${offset}px] left-[${offset}px]`,
      'bottom-center': `bottom-[${offset}px] left-1/2 -translate-x-1/2`,
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base positioning and sizing
          'fixed z-50 h-14 min-h-[56px] rounded-full sm:hidden',

          // Glass morphism effects
          'saturate-[180%] backdrop-blur-[24px]',
          'bg-gradient-to-br from-white/20 via-white/10 to-white/5',
          'border border-white/30',

          // Shadow and depth
          'shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]',

          // Hover state
          'hover:from-white/25 hover:via-white/15 hover:to-white/10',
          'hover:border-white/40',
          'hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.5)]',
          'hover:scale-110',

          // Active state
          'active:scale-95',

          // Focus state
          'focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none',

          // Transition
          'transition-all duration-300 ease-out',

          // Touch optimization
          'touch-manipulation',

          // Position
          positionClasses[position],

          // Layout
          'flex items-center justify-center gap-2',

          // Text
          'font-medium text-white',

          // Custom classes
          className
        )}
        {...props}
      >
        {/* Inner glow effect */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-50" />

        {/* Shimmer effect */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          {children && <span className="pr-2">{children}</span>}
        </span>
      </button>
    );
  }
);

MobileFAB.displayName = 'MobileFAB';

export { MobileFAB };
