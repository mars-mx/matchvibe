'use client';

import { SpeedInsights } from '@vercel/speed-insights/next';

interface SpeedInsightsProviderProps {
  children: React.ReactNode;
}

export function SpeedInsightsProvider({ children }: SpeedInsightsProviderProps) {
  return (
    <>
      {children}
      <SpeedInsights />
    </>
  );
}
