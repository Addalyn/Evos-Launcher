import { useEffect, useState } from 'react';

export default function useHasFocus() {
  const [focus, setFocus] = useState(document.hasFocus());

  useEffect(() => {
    const onFocus = () => {
      setFocus(true);
    };
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
