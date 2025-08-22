'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface UseSimulatedProgressOptions {
  expectedDuration?: number; // Expected duration in milliseconds
  updateInterval?: number; // How often to update progress in milliseconds
  minDuration?: number; // Minimum time to show loading (for UX)
  completionDelay?: number; // Delay before marking as complete after reaching 100%
}

interface UseSimulatedProgressReturn {
  progress: number;
  isComplete: boolean;
  isQuickFilling: boolean;
  start: () => void;
  complete: () => void;
  reset: () => void;
}

export function useSimulatedProgress({
  expectedDuration = 15000, // 15 seconds default (more realistic)
  updateInterval = 100, // Update every 100ms for smooth animation
  minDuration = 3000, // Show for at least 3 seconds
  completionDelay = 500, // Wait 500ms at 100% before completing
}: UseSimulatedProgressOptions = {}): UseSimulatedProgressReturn {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isQuickFilling, setIsQuickFilling] = useState(false);

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const quickFillTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);
  const isMountedRef = useRef(true);

  // Calculate progress using a logarithmic curve that slows down as it approaches 85%
  const calculateProgress = useCallback(
    (elapsedTime: number): number => {
      const ratio = Math.min(elapsedTime / expectedDuration, 1);

      // Use a logarithmic curve that reaches ~85% at expected duration
      // Using -5 instead of -3 for faster initial progression
      const baseProgress = 85 * (1 - Math.exp(-5 * ratio));

      // Add some variance to make it feel more natural
      const variance = Math.sin(elapsedTime / 1000) * 2;

      return Math.min(85, Math.max(0, baseProgress + variance));
    },
    [expectedDuration]
  );

  // Start the simulated progress
  const start = useCallback(() => {
    // Prevent multiple simultaneous starts
    if (isRunningRef.current) {
      return;
    }

    isRunningRef.current = true;
    startTimeRef.current = Date.now();
    setProgress(0);
    setIsComplete(false);
    setIsQuickFilling(false);

    // Clear any existing intervals/timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (quickFillTimeoutRef.current) {
      clearTimeout(quickFillTimeoutRef.current);
      quickFillTimeoutRef.current = null;
    }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }

    // Start the progress simulation
    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        return;
      }

      const elapsedTime = Date.now() - startTimeRef.current;
      const newProgress = calculateProgress(elapsedTime);
      setProgress(newProgress);

      // Stop updating if we've reached 85%
      if (newProgress >= 85) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, updateInterval);
  }, [calculateProgress, updateInterval]);

  // Complete the progress (instant fill to 100%)
  const complete = useCallback(() => {
    if (!isRunningRef.current || !isMountedRef.current) {
      return;
    }

    const elapsedTime = Date.now() - startTimeRef.current;

    // Ensure minimum duration for good UX
    const remainingMinTime = Math.max(0, minDuration - elapsedTime);

    // Clear the simulation interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear any existing quick fill timeout
    if (quickFillTimeoutRef.current) {
      clearTimeout(quickFillTimeoutRef.current);
      quickFillTimeoutRef.current = null;
    }

    // If we need to wait for minimum duration
    if (remainingMinTime > 0) {
      quickFillTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }

        // Instantly set to 100%
        setProgress(100);
        setIsQuickFilling(true);

        // Wait before marking as complete for smooth transition
        completionTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current) {
            return;
          }

          setIsComplete(true);
          setIsQuickFilling(false);
          isRunningRef.current = false;
        }, completionDelay);
      }, remainingMinTime);
    } else {
      // Instantly set to 100%
      setProgress(100);
      setIsQuickFilling(true);

      // Wait before marking as complete for smooth transition
      completionTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }

        setIsComplete(true);
        setIsQuickFilling(false);
        isRunningRef.current = false;
      }, completionDelay);
    }
  }, [minDuration, completionDelay]);

  // Reset everything
  const reset = useCallback(() => {
    // Clear all intervals and timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (quickFillTimeoutRef.current) {
      clearTimeout(quickFillTimeoutRef.current);
      quickFillTimeoutRef.current = null;
    }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }

    // Reset state
    setProgress(0);
    setIsComplete(false);
    setIsQuickFilling(false);
    startTimeRef.current = 0;
    isRunningRef.current = false;
  }, []);

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (quickFillTimeoutRef.current) {
        clearTimeout(quickFillTimeoutRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  return {
    progress,
    isComplete,
    isQuickFilling,
    start,
    complete,
    reset,
  };
}
