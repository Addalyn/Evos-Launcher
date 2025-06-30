import { useEffect } from 'react';
import EvosStore from './EvosStore';
import { getSpecialNames } from './Evos';

/**
 * Hook to sync developer status to the global store
 */
export default function useDevStatus() {
  const { activeUser, setDev } = EvosStore();

  useEffect(() => {
    async function checkDev() {
      if (!activeUser?.handle) {
        setDev(false);
        return;
      }
      try {
        const specialNames = await getSpecialNames();
        const isUserDeveloper =
          specialNames?.Developers?.includes(activeUser.handle) || false;
        setDev(isUserDeveloper);
      } catch {
        setDev(false);
      }
    }
    checkDev();
  }, [activeUser?.handle, setDev]);
}
