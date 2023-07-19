/* eslint-disable consistent-return */
/* eslint-disable no-unused-expressions */
import { useEffect, useRef } from 'react';

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
