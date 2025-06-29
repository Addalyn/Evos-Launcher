/**
 * @fileoverview LinkDiscord component for linking user accounts with Discord.
 * This component provides functionality to link EVOS player accounts with Discord accounts
 * through multiple methods: automatic linking, manual code entry, and Discord integration.
 * It handles API communication, state management, and user interface for the linking process.
 */

import {
  Dialog,
  DialogContent,
  TextField,
  DialogActions,
  DialogTitle,
  Avatar,
  InputAdornment,
  Alert,
  Button,
  Paper,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import EvosStore from 'renderer/lib/EvosStore';
import { logoSmall } from 'renderer/lib/Resources';
import { strapiClient } from 'renderer/lib/strapi';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';
import { withElectron } from 'renderer/utils/electronUtils';

/**
 * Interface representing a Discord link code from the API
 * @interface FindCode
 */
interface FindCode {
  /** Unique identifier for the link code record */
  id: number;
  /** Discord user ID */
  discordid: number;
  /** Discord username */
  discordname: string;
  /** The linking code generated for account connection */
  linkcode: string;
}

/**
 * Fetches Discord linking information for a given player name.
 *
 * This function queries the Strapi API to check if a player account
 * is already linked to a Discord account.
 *
 * @async
 * @function fetchInfo
 * @param {string} playername - The player's username to look up
 * @returns {Promise<number>} Returns:
 *   - -1: API is offline (502 error)
 *   - 0: Player not found or no Discord link
 *   - number: Discord ID if player is linked
 *
 * @example
 * ```tsx
 * const discordId = await fetchInfo('playerName');
 * if (discordId === -1) {
 *   // Handle offline state
 * } else if (discordId === 0) {
 *   // Player not linked
 * } else {
 *   // Player is linked with Discord ID: discordId
 * }
 * ```
 */
const fetchInfo = async (playername: string): Promise<number> => {
  try {
    const strapi = strapiClient.from('discords').select();
    strapi.equalTo('playername', playername);
    const { data, error } = await strapi.get();

    if (error?.status === 502) {
      return -1;
    }

    if (data?.length === 0) {
      return 0;
    }

    return (data && data[0]?.discordid) || 0;
  } catch (error) {
    return 0;
  }
};

/**
 * LinkDiscord component for linking user accounts with Discord.
 *
 * This component provides a comprehensive interface for linking EVOS player accounts
 * with Discord accounts. It supports multiple linking methods and handles various
 * states including offline mode, already linked accounts, and linking processes.
 *
 * Features:
 * - Automatic Discord account detection
 * - Manual code-based linking
 * - Discord bot integration for account linking
 * - Real-time status updates with periodic polling
 * - Offline mode detection and handling
 * - Navigation to Discord server
 *
 * Linking Methods:
 * 1. Automatic linking via Discord bot integration
 * 2. Manual linking using generated codes
 * 3. Direct navigation to Discord server
 *
 * @component
 * @returns {React.ReactElement | null} The Discord linking component or null if already linked
 *
 * @example
 * ```tsx
 * <LinkDiscord />
 * ```
 */
function LinkDiscord(): React.ReactElement | null {
  /** EvosStore hook for accessing user data and Discord ID state */
  const { activeUser, discordId, setDiscordId } = EvosStore();

  /** State for controlling the visibility of the code input dialog */
  const [codePopup, setCodePopup] = useState<boolean>(false);

  /** State for storing the user-entered linking code */
  const [code, setCode] = useState<string>('');

  /** Navigation hook for routing to different pages */
  const navigate = useNavigate();

  /** Translation hook for internationalization */
  const { t } = useTranslation();

  /** Update period in milliseconds for polling Discord link status */
  const UPDATE_PERIOD_MS = 300000;

  /** Determines update frequency based on window focus and user state */
  const updatePeriodMs =
    useHasFocus() || !activeUser ? UPDATE_PERIOD_MS : undefined;

  /** State for tracking API offline status */
  const [offline, setOffline] = useState<boolean>(false);

  /**
   * Fetches and updates Discord linking data for the current user.
   * Updates both the offline status and Discord ID based on API response.
   *
   * @async
   * @function fetchData
   * @returns {Promise<void>} Promise that resolves when fetch is complete
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!activeUser?.handle) {
      return;
    }

    const data = await fetchInfo(activeUser.handle);

    if (data === -1) {
      setOffline(true);
      return;
    }

    setOffline(false);
    setDiscordId(data);
  }, [activeUser, setDiscordId]);

  /** Interval hook to periodically fetch Discord linking status */
  useInterval(() => {
    fetchData();
  }, updatePeriodMs);

  /** Effect hook to fetch initial Discord linking data when component mounts */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Initiates Discord account linking via Electron IPC.
   * Triggers the Discord bot integration for automatic account linking.
   * First sends user data to main process, then starts Discord linking.
   *
   * @async
   * @function linkDiscord
   */
  const linkDiscord = async (): Promise<void> => {
    if (activeUser) {
      try {
        // First, send user data to the Discord service in main process
        const userSetResult = await withElectron((electron) =>
          electron.ipcRenderer.invoke('discord:setUser', activeUser),
        );

        if (userSetResult?.success) {
          // Then start Discord linking
          const linkingResult = await withElectron((electron) =>
            electron.ipcRenderer.invoke('discord:startLinking'),
          );

          if (linkingResult?.success) {
            // Now trigger the actual Discord OAuth flow
            withElectron((electron) =>
              electron.ipcRenderer.linkAccount(activeUser),
            );
          } else {
            // Failed to start Discord linking
          }
        } else {
          // Failed to set user data for Discord linking
        }
      } catch (error) {
        // Fallback to original method if new IPC channels don't exist
        withElectron((electron) =>
          electron.ipcRenderer.linkAccount(activeUser),
        );
      }
    }
  };

  /**
   * Navigates to the Discord page/channel.
   *
   * @function goToDiscord
   */
  const goToDiscord = (): void => {
    navigate('/discord');
  };

  /**
   * Opens the manual code entry dialog for Discord linking.
   *
   * @function linkWithCode
   */
  const linkWithCode = (): void => {
    if (activeUser) {
      setCodePopup(true);
    }
  };

  /**
   * Closes the code entry dialog and resets the popup state.
   *
   * @function handleCloseDialog
   */
  const handleCloseDialog = (): void => {
    setCodePopup(false);
  };

  /**
   * Handles the submission of a manual linking code.
   * Validates the code with the API and creates the Discord link if valid.
   *
   * @async
   * @function handleSubmit
   * @returns {Promise<void>} Promise that resolves when submission is complete
   */
  const handleSubmit = async (): Promise<void> => {
    if (!activeUser || !code.trim()) {
      return;
    }

    try {
      const strapi = strapiClient
        .from<FindCode>(`linkcodes/find/${code}`)
        .select();

      const { data, error } = await strapi.get();

      if (error?.status === 502) {
        setOffline(true);
        return;
      }

      if (data === null || data.length === 0) {
        return;
      }

      // Create Discord link record
      await strapiClient.from('discords').create({
        playername: activeUser.handle,
        discordid: data[0].discordid,
        discordname: data[0].discordname,
      });

      // Delete used link code
      await strapiClient.from(`linkcodes/delete/${code}`).deleteOne('');

      // Update local state
      setDiscordId(data[0].discordid);
      setCode('');
      setCodePopup(false);
    } catch (error) {
      // Handle submission error silently for now
    }
  };

  /**
   * Handles text input changes for the linking code field.
   *
   * @param {ChangeEvent<HTMLInputElement>} event - The input change event
   */
  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setCode(event.target.value);
  };

  // Early return if user is already linked and API is online
  if (discordId !== 0 && !offline) return null;

  return (
    <>
      {/* Main linking interface */}
      <Paper elevation={0} sx={{ width: '100%' }}>
        {offline ? (
          /* API offline alert */
          <Alert
            severity="error"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {t('APIOFFLINE')}
          </Alert>
        ) : (
          /* Discord linking options */
          <Alert
            severity="warning"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Trans i18nKey="LINKDISCORD" components={{ 1: <br /> }} />
            <br />
            <br />
            {/* Automatic linking button */}
            <Button variant="outlined" color="primary" onClick={linkDiscord}>
              {t('linkdiscordButton')}
            </Button>
            &nbsp;&nbsp;
            {/* Manual code linking button */}
            <Button variant="outlined" color="primary" onClick={linkWithCode}>
              {t('linkwithcode')}
            </Button>
            &nbsp;&nbsp;
            {/* Discord server navigation button */}
            <Button variant="outlined" color="primary" onClick={goToDiscord}>
              {t('joindiscordButton')}
            </Button>
          </Alert>
        )}
      </Paper>

      {/* Manual code entry dialog */}
      <Dialog
        open={codePopup}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('linkwithcode')}</DialogTitle>
        <DialogContent style={{ overflowX: 'hidden' }}>
          {/* Code input field with logo */}
          <TextField
            placeholder={t('entercode')}
            value={code}
            style={{ flexGrow: 1, marginRight: '1em' }}
            variant="outlined"
            onChange={handleCodeChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Avatar
                    alt="logo"
                    variant="square"
                    src={logoSmall()}
                    sx={{
                      flexShrink: 1,
                      width: 40,
                      height: 40,
                    }}
                  />
                </InputAdornment>
              ),
            }}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          {/* Submit code button */}
          <Button onClick={handleSubmit} color="primary">
            {t('submit')}
          </Button>
          {/* Close dialog button */}
          <Button onClick={handleCloseDialog}>{t('replay.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default LinkDiscord;
