'use client';

import { cn } from '@/lib/utils';

interface UserValuesChartProps {
  user1Name: string;
  user2Name: string;
  value1: number | null;
  value2: number | null;
  className?: string;
}

export function UserValuesChart({
  user1Name,
  user2Name,
  value1,
  value2,
  className,
}: UserValuesChartProps) {
  if (value1 === null || value2 === null) {
    return null;
  }

  // Convert 0-1 scale to percentage
  const percentage1 = Math.round(value1 * 100);
  const percentage2 = Math.round(value2 * 100);

  const getBarColor = (value: number) => {
    if (value >= 0.8)
      return 'bg-gradient-to-r from-green-400/60 to-green-300/40 shadow-green-400/20';
    if (value >= 0.6) return 'bg-gradient-to-r from-blue-400/60 to-blue-300/40 shadow-blue-400/20';
    if (value >= 0.4)
      return 'bg-gradient-to-r from-yellow-400/60 to-yellow-300/40 shadow-yellow-400/20';
    if (value >= 0.2)
      return 'bg-gradient-to-r from-orange-400/60 to-orange-300/40 shadow-orange-400/20';
    return 'bg-gradient-to-r from-red-400/60 to-red-300/40 shadow-red-400/20';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="space-y-2">
        {/* User 1 Bar */}
        <div className="flex items-center gap-2">
          <span className="w-14 truncate text-[11px] font-medium text-white/70">@{user1Name}</span>
          <div className="relative h-4 flex-1 overflow-hidden rounded-full border border-white/10 bg-black/30 backdrop-blur-sm">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full shadow-lg transition-all duration-300',
                getBarColor(value1)
              )}
              style={{ width: `${percentage1}%` }}
            />
          </div>
          <span className="w-10 text-right text-[11px] font-bold text-white/90 tabular-nums">
            {percentage1}%
          </span>
        </div>

        {/* User 2 Bar */}
        <div className="flex items-center gap-2">
          <span className="w-14 truncate text-[11px] font-medium text-white/70">@{user2Name}</span>
          <div className="relative h-4 flex-1 overflow-hidden rounded-full border border-white/10 bg-black/30 backdrop-blur-sm">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full shadow-lg transition-all duration-300',
                getBarColor(value2)
              )}
              style={{ width: `${percentage2}%` }}
            />
          </div>
          <span className="w-10 text-right text-[11px] font-bold text-white/90 tabular-nums">
            {percentage2}%
          </span>
        </div>
      </div>

      {/* Difference indicator */}
      <div className="border-t border-white/5 pt-1.5 text-center text-[10px] text-white/50">
        <span className="font-medium">Δ {Math.abs(percentage1 - percentage2)}%</span>
      </div>
    </div>
  );
}
