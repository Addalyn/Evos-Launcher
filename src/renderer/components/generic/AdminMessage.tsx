/**
 * @fileoverview AdminMessage component for displaying admin messages and account lock status.
 * This component handles fetching player information, checking for dodges, and displaying
 * appropriate messages to users based on their account status.
 */

/* eslint-disable consistent-return */
/* eslint-disable promise/always-return */
import { trackEvent } from '@aptabase/electron/renderer';
import { Alert, Paper, Typography } from '@mui/material';
import { AxiosResponse } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { AccountData, getPlayerInfo } from 'renderer/lib/Evos';
import EvosStore from 'renderer/lib/EvosStore';
import { strapiClient } from 'renderer/lib/strapi';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';

/**
 * Interface representing dodge data from the backend
 * @interface Dodges
 */
interface Dodges {
  /** The username of the player who dodged */
  user: string;
  /** The number of dodges */
  amount: number;
  /** The date of the last dodge */
  lastDodge: Date;
}

/**
 * AdminMessage component that displays admin messages and account lock status.
 * Fetches player information periodically and shows appropriate warnings or messages.
 *
 * @component
 * @returns {ReactElement | null} The admin message component or null if no message to display
 */
function AdminMessage(): ReactElement | null {
  const [account, setAccount] = useState<AccountData | undefined>(undefined);
  const { activeUser } = EvosStore();
  const { t } = useTranslation();

  /** Update period in milliseconds for fetching account data */
  const UPDATE_PERIOD_MS = 300000;

  /** Determines update frequency based on window focus and account state */
  const updatePeriodMs =
    useHasFocus() || !account ? UPDATE_PERIOD_MS : undefined;

  /**
   * Updates the account state based on player information and dodge data.
   * Fetches dodge information from Strapi and processes it to determine
   * if an admin message should be displayed.
   *
   * @param {AxiosResponse<AccountData, any>} resp - The response containing account data
   * @returns {Promise<void>} Promise that resolves when account is updated
   */
  const updateAccount = useCallback(
    async (resp: AxiosResponse<AccountData, any>): Promise<void> => {
      if (!resp.data || !activeUser?.user) {
        return;
      }

      try {
        const strapi = strapiClient
          .from<Dodges>('dodges')
          .select()
          .equalTo('user', activeUser.user);
        const { data: dodgesData } = await strapi.get();

        if (dodgesData && resp.data.adminMessage === null) {
          // Filter dodges from the last 7 days
          const filteredDodges = dodgesData.filter((dodge) => {
            const lastDodge = new Date(dodge.lastDodge);
            const currentDate = new Date();
            const diffTime = Math.abs(
              currentDate.getTime() - lastDodge.getTime(),
            );
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays < 7;
          });

          if (filteredDodges.length > 0) {
            trackEvent('dodges', {
              user: activeUser.user,
              amount: filteredDodges.length,
            });

            setAccount({
              ...resp.data,
              adminMessage: t('admin.DodgeMessage', {
                user: activeUser.user,
                amount: filteredDodges.length,
              }),
            });
            return;
          }

          setAccount(resp.data);
          return;
        }

        // Check if account is locked but lock period has expired
        if (resp.data.locked && new Date(resp.data.lockedUntil) < new Date()) {
          setAccount({
            ...resp.data,
            locked: false,
          });
          return;
        }

        setAccount(resp.data);
      } catch (error) {
        // Fallback to setting account data if dodge fetch fails
        setAccount(resp.data);
      }
    },
    [activeUser, t],
  );

  /**
   * Effect hook to fetch initial player information when activeUser changes.
   * Resets account state and fetches fresh data for the new user.
   */
  useEffect(() => {
    if (activeUser) {
      setAccount(undefined);
      getPlayerInfo(activeUser.token)
        .then((resp) => {
          if (resp?.data) {
            updateAccount(resp);
          }
        })
        .catch(() => {
          // Silently handle error - user will see no admin message
        });
    }
  }, [activeUser, updateAccount]);

  /**
   * Interval hook to periodically update player information.
   * Only runs when window has focus or when account data is not loaded.
   */
  useInterval(() => {
    if (!activeUser?.token) {
      return;
    }

    getPlayerInfo(activeUser.token)
      .then(async (resp) => {
        if (resp?.data) {
          updateAccount(resp);
        }
      })
      .catch(() => {
        // Silently handle error - user will see no admin message
      });
  }, updatePeriodMs);

  // Early returns with proper type guards
  if (!account) {
    return null;
  }

  if (account.adminMessage === '' && !account.locked) {
    return null;
  }

  /**
   * Renders account lock message when account is locked
   */
  if (account.locked) {
    return (
      <Paper elevation={0} sx={{ width: '100%' }}>
        <Alert severity="error" sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h3">{t('admin.Locked')}</Typography>
          <Typography variant="body1">
            {t('admin.LockedUntill')}{' '}
            {new Date(account.lockedUntil).toLocaleString()}
          </Typography>
          <Typography variant="body1" sx={{ marginTop: '5px' }}>
            {account.lockedReason.split('\n').map((line) => (
              <div
                key={`locked-reason-${line.slice(0, 20)}-${line.length}`}
                style={{ paddingTop: '5px' }}
              >
                {line}
              </div>
            ))}
          </Typography>
        </Alert>
      </Paper>
    );
  }

  /**
   * Renders admin message when available
   */
  if (account.adminMessage) {
    return (
      <Paper elevation={0} sx={{ width: '100%' }}>
        <Alert severity="error" sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h3">{t('admin.Message')}</Typography>
          <Typography variant="body1">
            {account.adminMessage.split('\n').map((line) => (
              <div
                key={`admin-message-${line.slice(0, 20)}-${line.length}`}
                style={{ paddingTop: '5px' }}
              >
                {line}
              </div>
            ))}
          </Typography>
        </Alert>
      </Paper>
    );
  }

  // No admin message or lock status to display
  return null;
}

export default AdminMessage;
