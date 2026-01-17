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
  
  // Check if there's an active game
  const hasActiveGame = activeGames[activeUser?.user as string];
  
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
        display: 'flex',
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
              color: 'white',
              height: '52px',
              minWidth: '180px',
              borderRadius: '12px',
              background: hasActiveGame
                ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.9) 0%, rgba(211, 47, 47, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(76, 175, 80, 0.9) 0%, rgba(56, 142, 60, 0.9) 100%)',
              backdropFilter: 'blur(10px)',
              border: hasActiveGame
                ? '1px solid rgba(244, 67, 54, 0.3)'
                : '1px solid rgba(76, 175, 80, 0.3)',
              boxShadow: hasActiveGame
                ? '0 4px 16px rgba(244, 67, 54, 0.3)'
                : '0 4px 16px rgba(76, 175, 80, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                transition: 'left 0.5s',
              },
              '&:hover': {
                transform: 'translateY(-2px) scale(1.02)',
                boxShadow: hasActiveGame
                  ? '0 8px 24px rgba(244, 67, 54, 0.5)'
                  : '0 8px 24px rgba(76, 175, 80, 0.5)',
                background: hasActiveGame
                  ? 'linear-gradient(135deg, rgba(244, 67, 54, 1) 0%, rgba(211, 47, 47, 1) 100%)'
                  : 'linear-gradient(135deg, rgba(76, 175, 80, 1) 0%, rgba(56, 142, 60, 1) 100%)',
                border: hasActiveGame
                  ? '1px solid rgba(244, 67, 54, 0.5)'
                  : '1px solid rgba(76, 175, 80, 0.5)',
              },
              '&:hover::before': {
                left: '100%',
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)',
              },
              '&:disabled': {
                background: 'rgba(100, 100, 100, 0.3)',
                border: '1px solid rgba(100, 100, 100, 0.2)',
                boxShadow: 'none',
              },
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
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
              }}
            />
            <Typography
              variant="button"
              display="block"
              gutterBottom
              sx={{
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '0.5px',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                mb: 0,
              }}
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
