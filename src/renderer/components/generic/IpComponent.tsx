/**
 * @fileoverview IpComponent for selecting and configuring server IP addresses.
 * This component provides a user interface for selecting between different EVOS server
 * endpoints including the main server and various proxy servers. It handles IP selection
 * state management and integrates with the global EvosStore for persistence.
 */

import React, { useState } from 'react';
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

/**
 * Type definition for available server IP options
 */
type ServerIpOption =
  | 'ar.zheneq.net'
  | 'de.evos.live'
  | 'fr.evos.live'
  | 'fi.evos.live'
  | 'ru.ar.zheneq.net';

/**
 * IpComponent for selecting and configuring server IP addresses.
 *
 * This component provides a user interface for selecting between different EVOS server
 * endpoints. Users can choose from the main server or various proxy servers located
 * in different regions. The selected IP is stored in the global EvosStore.
 *
 * Available server options:
 * - ar.zheneq.net: Main server (no proxy)
 * - de.evos.live: German proxy server
 * - fr.evos.live: French proxy server
 * - fi.evos.live: Finnish proxy server
 * - ru.ar.zheneq.net: Russian proxy server
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

  /** State for tracking the currently selected IP address */
  const [selectedIp, setSelectedIp] = useState<ServerIpOption>('ar.zheneq.net');

  /** Translation hook for internationalization */
  const { t } = useTranslation();

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
    setSelectedIp(event.target.value as ServerIpOption);
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
            <MenuItem value="ar.zheneq.net">{t('ips.noProxy')}</MenuItem>
            <MenuItem value="de.evos.live">{t('ips.proxy1')}</MenuItem>
            <MenuItem value="fr.evos.live">{t('ips.proxy2')}</MenuItem>
            <MenuItem value="fi.evos.live">{t('ips.proxy3')}</MenuItem>
            <MenuItem value="ru.ar.zheneq.net">{t('ips.proxy4')}</MenuItem>
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
