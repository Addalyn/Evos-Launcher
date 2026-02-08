/**
 * @fileoverview ApiVersionToggle component for selecting between different API versions.
 * This component provides a user interface for switching between production (2025) and
 * legacy (2023-2024) API versions, with visual indicators for current and legacy versions.
 */

import React from 'react';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Api as ApiIcon } from '@mui/icons-material';
import EvosStore from 'renderer/lib/EvosStore';

/**
 * Valid API version types
 */
type ApiVersion = 'production' | 'v1';

/**
 * ApiVersionToggle component for selecting between different API versions.
 *
 * This component provides a user-friendly interface for switching between:
 * - Production API (2025) - Current version
 * - Legacy API (2023-2024) - Legacy version
 *
 * The component uses Material-UI components for styling and EvosStore for state management.
 *
 * @component
 * @returns {React.ReactElement} The API version toggle component
 */
export default function ApiVersionToggle(): React.ReactElement {
  /** Translation hook for internationalization */
  const { t } = useTranslation();

  /** API version state and setter from EvosStore */
  const { apiVersion, setApiVersion } = EvosStore();

  /**
   * Handles API version selection change
   * @param {SelectChangeEvent<string>} event - The select change event
   */
  const handleApiVersionChange = (event: SelectChangeEvent<string>) => {
    const newVersion = event.target.value as ApiVersion;
    setApiVersion(newVersion);
  };

  return (
    <Paper
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        margin: '1em',
        padding: '1em',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        {/* API Icon and Title Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ApiIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('settings.statsVersion', 'Stats Version')}
          </Typography>
        </Box>

        {/* Spacer to push select to the right */}
        <Box sx={{ flex: 1 }} />

        {/* API Version Select Control */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="api-version-select-label">Stats Version</InputLabel>
          <Select
            labelId="api-version-select-label"
            value={apiVersion}
            label="API Version"
            onChange={handleApiVersionChange}
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              },
            }}
          >
            {/* Production API Option (Current) */}
            <MenuItem value="production">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>2025-2026</Typography>
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  (Current)
                </Typography>
              </Box>
            </MenuItem>

            {/* Legacy API Option */}
            <MenuItem value="v1">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>2023-2024</Typography>
                <Typography variant="caption" color="text.secondary">
                  (Legacy)
                </Typography>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Paper>
  );
}
