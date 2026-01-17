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
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: '12px',
        display: { xs: 'none', md: 'flex' },
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(0, 0, 0, 0.03)',
        border: (theme) =>
          theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.05)',
          border: (theme) =>
            theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.12)'
              : '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <TextField
        id="branch-select"
        select
        label={t('settings.selectBranch')}
        value={branch}
        onChange={onBranchChange}
        variant="filled"
        size="small"
        disabled={locked}
        fullWidth
        inputProps={{ IconComponent: () => null }}
        sx={{
          '& .MuiFilledInput-root': {
            borderRadius: '12px',
            background: 'transparent',
            '&:before, &:after': {
              display: 'none',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '13px', // Slightly smaller label
            fontWeight: 500,
            transform: 'translate(12px, 10px) scale(1)', // Adjusted label position
            '&.Mui-focused, &.MuiFormLabel-filled': {
              transform: 'translate(12px, 4px) scale(0.75)',
            },
          },
        }}
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
