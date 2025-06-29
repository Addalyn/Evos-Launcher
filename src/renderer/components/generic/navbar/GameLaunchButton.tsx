/**
 * @fileoverview Game launch button component for the Navbar
 * Handles game launching and termination functionality.
 *
 * @author Evos Launcher Team
 * @since 2.2.6
 */

import React from 'react';
import { Button, Typography, Tooltip, Box } from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { useTranslation } from 'react-i18next';
import type { AuthUser } from 'renderer/lib/EvosStore';

interface GameLaunchButtonProps {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether downloads are in progress */
  isDownloading: boolean;
  /** Whether game is being patched */
  isPatching: boolean;
  /** Whether patching is needed */
  needPatching: boolean;
  /** Whether account is locked */
  accountLocked: boolean | undefined;
  /** Current branch */
  branch: string;
  /** Tooltip title text */
  tooltipTitle: string;
  /** Whether exe path is valid */
  isValidExe: boolean;
  /** Active games mapping by username */
  activeGames: { [username: string]: boolean };
  /** Currently active user */
  activeUser: AuthUser | null;
  /** Handler for launch button click */
  onLaunchClick: () => void;
}

/**
 * Game launch button component that handles game launching and termination.
 * Shows appropriate state based on game status and user permissions.
 *
 * @param {GameLaunchButtonProps} props - Component props
 * @returns {React.ReactElement | null} Game launch button or null if conditions not met
 */
export default function GameLaunchButton({
  isAuthenticated,
  isDownloading,
  isPatching,
  needPatching,
  accountLocked = false,
  branch,
  tooltipTitle,
  isValidExe,
  activeGames,
  activeUser,
  onLaunchClick,
}: GameLaunchButtonProps): React.ReactElement | null {
  const { t } = useTranslation();
  // Only show if user is authenticated and conditions are met
  if (
    !isAuthenticated ||
    isDownloading ||
    isPatching ||
    needPatching ||
    accountLocked ||
    branch === 'Original'
  ) {
    return null;
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        justifyContent: 'center',
      }}
    >
      <Tooltip
        title={tooltipTitle}
        slotProps={{
          popper: {
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 14],
                },
              },
            ],
          },
        }}
      >
        <span>
          <Button
            variant="contained"
            color="secondary"
            sx={{
              '-webkit-app-region': 'no-drag',
              height: '49.5px',
              borderRadius: '0px',
            }}
            disabled={
              !isValidExe || isDownloading || isPatching || accountLocked
            }
            onClick={onLaunchClick}
          >
            <SportsEsportsIcon
              sx={{
                height: '25px',
                width: '25px',
                display: { xs: 'flex', md: 'none' },
              }}
            />
            <Typography
              variant="button"
              display="block"
              gutterBottom
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {activeGames[activeUser?.user as string]
                ? `${t('game.kill')} ${activeUser?.user}`
                : `${t('game.play')} ${activeUser?.user}`}
            </Typography>
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
}
