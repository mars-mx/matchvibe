'use client';

import { forwardRef, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BottomActionBarProps extends HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
  showDividers?: boolean;
}

const BottomActionBar = forwardRef<HTMLDivElement, BottomActionBarProps>(
  ({ className, actions, showDividers = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base positioning
          'fixed right-0 bottom-0 left-0 z-40 sm:hidden',

          // Glass morphism effects
          'saturate-[200%] backdrop-blur-[20px]',
          'bg-gradient-to-t from-white/12 to-white/8',
          'border-t border-white/20',

          // Shadow for depth
          'shadow-[0_-4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]',

          // Safe area padding for iOS
          'pb-safe-area-inset-bottom',

          // Animation
          'transition-transform duration-300 ease-out',

          // Custom classes
          className
        )}
        {...props}
      >
        {/* Top highlight line */}
        <div className="pointer-events-none absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Content container */}
        <div className="relative px-4 py-3">
          {/* Actions or children */}
          {actions || children}

          {/* Dividers between actions if enabled */}
          {showDividers && <div className="absolute inset-y-0 left-1/3 w-px bg-white/10" />}
          {showDividers && <div className="absolute inset-y-0 right-1/3 w-px bg-white/10" />}
        </div>

        {/* Bottom gradient fade for depth */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-t from-black/10 to-transparent" />
      </div>
    );
  }
);

BottomActionBar.displayName = 'BottomActionBar';

// Action button component for use within the bar
export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label?: string;
  active?: boolean;
}

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, icon, label, active = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'flex flex-1 flex-col items-center justify-center gap-1 px-3 py-2',
          'min-h-[48px] touch-manipulation',

          // Text styles
          'text-xs font-medium',
          active ? 'text-white' : 'text-white/70',

          // Hover state
          'hover:bg-white/5 hover:text-white',

          // Active state
          'active:scale-95 active:bg-white/10',

          // Focus state
          'focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none focus-visible:ring-inset',

          // Transition
          'transition-all duration-200',

          // Border radius
          'rounded-lg',

          className
        )}
        {...props}
      >
        {icon && (
          <span className={cn('text-lg', active && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]')}>
            {icon}
          </span>
        )}
        {label && <span>{label}</span>}
      </button>
    );
  }
);

ActionButton.displayName = 'ActionButton';

// Compound component export
const BottomActionBarNamespace = Object.assign(BottomActionBar, {
  Action: ActionButton,
});

export { BottomActionBarNamespace as BottomActionBar, ActionButton };

// Re-export for convenient imports
export default BottomActionBarNamespace;
