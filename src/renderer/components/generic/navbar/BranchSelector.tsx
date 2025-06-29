/**
 * @fileoverview Branch selector component for the Navbar
 * Handles branch selection and switching functionality.
 *
 * @author Evos Launcher Team
 * @since 2.2.6
 */

import React from 'react';
import { TextField, MenuItem, Paper } from '@mui/material';
import type { Branches } from 'renderer/lib/Evos';
import { useTranslation } from 'react-i18next';

interface BranchSelectorProps {
  /** Available branches data */
  branchesData: Branches;
  /** Current selected branch */
  branch: string;
  /** Whether the selector is disabled */
  locked: boolean;
  /** Whether user has developer permissions */
  isDev: boolean;
  /** Handler for branch selection change */
  onBranchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Branch selector component that allows users to switch between game branches.
 * Displays available branches with recommendations and status indicators.
 *
 * @param {BranchSelectorProps} props - Component props
 * @returns {React.ReactElement} Branch selector component
 */
export default function BranchSelector({
  branchesData,
  branch,
  locked,
  isDev,
  onBranchChange,
}: BranchSelectorProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={3}
      sx={{
        width: '100%',
        borderRadius: 0,
        display: { xs: 'none', md: 'flex' },
        position: 'sticky',
        top: 0,
      }}
    >
      <TextField
        id="branch-select"
        select
        label={t('settings.selectBranch')}
        value={branch}
        onChange={onBranchChange}
        variant="filled"
        disabled={locked}
        fullWidth
        inputProps={{ IconComponent: () => null }}
      >
        {Object.keys(branchesData).map((key) => {
          const branchInfo = branchesData[key];
          if (
            branchInfo &&
            (branchInfo.enabled || (isDev && branchInfo.devOnly))
          ) {
            return (
              <MenuItem key={key} value={key} disabled={branchInfo.disabled}>
                {key}{' '}
                {branchInfo.recommended
                  ? ` (${t('settings.recommended')})`
                  : ''}
                {branchInfo.removed ? ` (${t('settings.removed')})` : ''}
              </MenuItem>
            );
          }
          return null;
        })}
      </TextField>
    </Paper>
  );
}
