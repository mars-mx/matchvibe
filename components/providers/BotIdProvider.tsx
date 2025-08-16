'use client';

import { createContext, useContext, Suspense, lazy } from 'react';
import { PROTECTED_PATHS } from '@/lib/security/botid';

interface BotIdContextValue {
  /**
   * Whether Bot ID protection is enabled
   */
  isProtected: boolean;
}

const BotIdContext = createContext<BotIdContextValue>({
  isProtected: false,
});

// Lazy load the BotIdClient component to avoid blocking initial page load
const BotIdClient = lazy(() =>
  import('botid/client').then((module) => ({
    default: module.BotIdClient,
  }))
);

/**
 * Provider component that initializes Bot ID protection client-side
 * Should wrap the entire application
 */
export function BotIdProvider({ children }: { children: React.ReactNode }) {
  // Only render BotIdClient in production or if explicitly enabled
  const shouldRenderBotId =
    process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_BOTID_ENABLED === 'true';

  return (
    <BotIdContext.Provider value={{ isProtected: shouldRenderBotId }}>
      {shouldRenderBotId && (
        <Suspense fallback={null}>
          <BotIdClient protect={[...PROTECTED_PATHS]} />
        </Suspense>
      )}
      {children}
    </BotIdContext.Provider>
  );
}

/**
 * Hook to check if Bot ID protection is active
 */
export function useBotId() {
  const context = useContext(BotIdContext);

  if (!context) {
    throw new Error('useBotId must be used within BotIdProvider');
  }

  return context;
}

/**
 * Hook to check if a specific endpoint is protected
 * @param endpoint - The endpoint path to check
 * @param method - The HTTP method (default: POST)
 */
export function useBotIdProtection(endpoint: string, method: string = 'POST') {
  const { isProtected } = useBotId();

  // Check if this specific endpoint is in our protected paths
  const isEndpointProtected = PROTECTED_PATHS.some(
    (path) => path.path === endpoint && path.method === method
  );

  return {
    isProtected: isProtected && isEndpointProtected,
    isReady: true, // Always ready since BotIdClient handles its own initialization
    isProcessing: false, // Removed fake event tracking
    shouldDisableAction: false, // Don't disable actions - Bot ID works invisibly
  };
}
