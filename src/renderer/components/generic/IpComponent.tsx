/**
 * @fileoverview IpComponent for selecting and configuring server IP addresses.
 * This component provides a user interface for selecting between different EVOS server
 * endpoints including the main server and various proxy servers. It handles IP selection
 * state management and integrates with the global EvosStore for persistence.
 */

import React, { useEffect, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Button,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import EvosStore from 'renderer/lib/EvosStore';
import { useTranslation } from 'react-i18next';
import { getProxys, type Proxy } from 'renderer/lib/Evos';

/**
 * IpComponent for selecting and configuring server IP addresses.
 *
 * This component provides a user interface for selecting between different EVOS server
 * endpoints. Users can choose from the main server or various proxy servers located
 * in different regions. The selected IP is stored in the global EvosStore.
 * The list of available proxies is fetched dynamically from the remote proxy list.
 *
 * @component
 * @returns {React.ReactElement} The IP selection component
 *
 * @example
 * ```tsx
 * <IpComponent />
 * ```
 */
function IpComponent(): React.ReactElement {
  /** EvosStore hook for accessing IP setter function */
  const { setIp } = EvosStore();

  /** Dynamically fetched proxy list */
  const [proxies, setProxies] = useState<Proxy[]>([]);

  /** State for tracking the currently selected IP address */
  const [selectedIp, setSelectedIp] = useState<string>('');

  /** Translation hook for internationalization */
  const { t, i18n } = useTranslation();

  /** Fetch the proxy list on mount */
  useEffect(() => {
    getProxys()
      .then((response) => {
        const list: Proxy[] = response.data;
        setProxies(list);
        if (list.length > 0 && selectedIp === '') {
          setSelectedIp(list[0].ip);
        }
        return list;
      })
      .catch(() => {
        // silently ignore fetch errors
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handles form submission and updates the global IP setting
   * @function onSubmit
   */
  const onSubmit = (): void => {
    setIp(selectedIp);
  };

  /**
   * Handles IP selection change from the dropdown
   * @param {SelectChangeEvent<string>} event - The select change event
   */
  const handleSelectChange = (event: SelectChangeEvent<string>): void => {
    setSelectedIp(event.target.value);
  };

  return (
    <>
      {/* Component title */}
      <Typography component="h1" variant="h5">
        {t('selectIp')}
      </Typography>

      {/* IP selection form */}
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1 }}>
        {/* Server IP dropdown selection */}
        <FormControl fullWidth>
          <Select value={selectedIp} onChange={handleSelectChange}>
            {proxies.map((proxy) => (
              <MenuItem key={proxy.ip} value={proxy.ip}>
                {proxy[i18n.language] || proxy.en || proxy.name || proxy.ip}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Submit button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            mt: 3,
            mb: 2,
            backgroundColor: (theme) => theme.palette.primary.light,
          }}
        >
          {t('submit')}
        </Button>
      </Box>
    </>
  );
}

export default IpComponent;
