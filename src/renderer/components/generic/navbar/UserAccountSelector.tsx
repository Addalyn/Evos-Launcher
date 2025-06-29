/**
 * @fileoverview User account selector component for the Navbar
 * Handles multi-user account switching and management.
 *
 * @author Evos Launcher Team
 * @since 2.2.6
 */

import React from 'react';
import { Select, Stack, MenuItem, ListSubheader } from '@mui/material';
import type { AuthUser } from 'renderer/lib/EvosStore';
import type { PlayerData } from 'renderer/lib/Evos';
import Player from '../../atlas/Player';
import { useTranslation } from 'react-i18next';

interface UserAccountSelectorProps {
  /** Currently active user */
  activeUser: AuthUser | null;
  /** Array of all authenticated users */
  authenticatedUsers: AuthUser[];
  /** Player information mapping by handle */
  playerInfoMap: { [key: string]: PlayerData };
  /** Whether downloads are in progress */
  isDownloading: boolean;
  /** Handler for user switching */
  onSwitchUser: (event: React.MouseEvent<HTMLElement>) => void;
  /** Handler for adding new user */
  onAddUser: () => void;
  /** Handler for logout */
  onLogout: () => void;
}

/**
 * User account selector component that displays current user and allows switching
 * between authenticated accounts. Also provides options to add accounts and logout.
 *
 * @param {UserAccountSelectorProps} props - Component props
 * @returns {React.ReactElement} User account selector component
 */
export default function UserAccountSelector({
  activeUser,
  authenticatedUsers,
  playerInfoMap,
  isDownloading,
  onSwitchUser,
  onAddUser,
  onLogout,
}: UserAccountSelectorProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ cursor: 'pointer', '-webkit-app-region': 'no-drag' }}
    >
      <Select
        value={activeUser?.handle}
        label=""
        disabled={isDownloading}
        variant="standard"
        disableUnderline
        sx={{
          width: '92%',
          height: '50.5px',
        }}
        inputProps={{ IconComponent: () => null }}
      >
        <ListSubheader>{t('accounts')}</ListSubheader>
        {authenticatedUsers.map((user) => (
          <MenuItem
            value={user.handle}
            key={user.user}
            onClick={onSwitchUser}
            sx={{
              width: '100%',
            }}
          >
            <Player
              info={playerInfoMap[user.handle]}
              disableSkew
              characterType={undefined}
              titleOld=""
            />
          </MenuItem>
        ))}
        <ListSubheader>{t('actions')}</ListSubheader>
        <MenuItem onClick={onAddUser}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              minHeight: '36.5px',
            }}
          >
            {t('addAccount')}
          </div>
        </MenuItem>
        <MenuItem onClick={onLogout}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              minHeight: '36.5px',
            }}
          >
            {t('logout')}
          </div>
        </MenuItem>
      </Select>
    </Stack>
  );
}
