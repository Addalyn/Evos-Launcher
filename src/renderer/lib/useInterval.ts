/**
 * @fileoverview Custom React hook for managing intervals with proper cleanup
 * Provides a declarative way to use setInterval with automatic cleanup and callback memoization.
 * Prevents memory leaks and ensures intervals are properly cleared on unmount.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

/* eslint-disable consistent-return */
/* eslint-disable no-unused-expressions */
import { useEffect, useRef } from 'react';

/**
 * Custom hook that provides setInterval functionality with proper cleanup
 * @param callback - The function to call at each interval
 * @param ms - The interval duration in milliseconds, or null/undefined to disable
 */
export default function useInterval(callback: () => void, ms?: number) {
  // do not trigger on callback change
  const savedCallback = useRef<() => void>();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current && savedCallback.current();
    }
    if (ms) {
      tick();
      const id = setInterval(tick, ms);
      // cleanup
      return () => clearInterval(id);
    }
  }, [ms]);
}
