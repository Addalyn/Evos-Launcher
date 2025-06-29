/**
 * @fileoverview Custom React hook for tracking window dimensions
 * Provides real-time window width and height information with automatic updates on resize.
 * Handles SSR compatibility by checking for window availability.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import { useEffect, useState } from 'react';

/**
 * Custom hook that provides current window dimensions
 * @returns Object containing current window width and height, updates on resize
 */
export default function useWindowDimensions() {
  const hasWindow = typeof window !== 'undefined';

  function getWindowDimensions() {
    const width = hasWindow ? window.outerWidth : null;
    const height = hasWindow ? window.outerHeight : null;
    return {
      width,
      height,
    };
  }

  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions(),
  );

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (hasWindow) {
      // eslint-disable-next-line no-inner-declarations
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasWindow]);

  return windowDimensions;
}
