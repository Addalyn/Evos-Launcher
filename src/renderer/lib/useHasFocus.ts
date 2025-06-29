import { useEffect, useState } from 'react';

/**
 * Custom React hook that tracks whether the window/document currently has focus.
 *
 * This hook listens to the window's 'focus' and 'blur' events to determine
 * if the current window is active (focused) or inactive (blurred).
 *
 * @returns {boolean} True if the window has focus, false otherwise
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hasFocus = useHasFocus();
 *
 *   return (
 *     <div>
 *       Window is {hasFocus ? 'focused' : 'blurred'}
 *     </div>
 *   );
 * }
 * ```
 */
export default function useHasFocus() {
  const [focus, setFocus] = useState(document.hasFocus());

  useEffect(() => {
    /**
     * Event handler for when the window gains focus
     */
    const onFocus = () => {
      setFocus(true);
    };

    /**
     * Event handler for when the window loses focus
     */
    const onBlur = () => {
      setFocus(false);
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    // cleanup
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return focus;
}
