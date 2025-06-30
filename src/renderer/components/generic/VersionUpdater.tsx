/* eslint-disable no-console */
/**
 * @fileoverview VersionUpdater component for handling application version updates.
 * Checks for new versions, notifies the user, and triggers update/restart flows.
 */
import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogContentText,
  Button,
} from '@mui/material';
import { withElectron } from 'renderer/utils/electronUtils';
import { useTranslation } from 'react-i18next';
import semverGt from 'semver/functions/gt';
import { getUpdateInfo } from 'renderer/lib/Evos';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';

/**
 * Interface for version information response from the API
 */
interface GetVersion {
  /** The version number, as string or number */
  version: number | string;
}

/**
 * VersionUpdater component
 * Handles version checking, update notifications, and restart flow.
 * @param {VersionUpdaterProps} props
 * @returns {JSX.Element}
 */
function VersionUpdater() {
  const [message, setMessage] = useState<string>('');
  const [latestVersion, setLatestVersion] = useState<GetVersion | undefined>();
  const [version, setVersion] = useState<number | string | undefined>();
  const [ready, setReady] = useState<boolean>(false);
  const [needUpdate, setNeedUpdate] = useState<boolean>(false);
  const { t } = useTranslation();
  const [showRestartDialog, setShowRestartDialog] = useState<boolean>(false);

  // Fetch local version once on mount
  useEffect(() => {
    withElectron(async (electron) => {
      if (typeof electron.ipcRenderer.getVersion !== 'function') {
        setVersion(undefined);
        return;
      }
      try {
        const result = electron.ipcRenderer.getVersion();
        if (result && typeof result.then === 'function') {
          try {
            const v = await result;
            setVersion(v);
          } catch (err) {
            setVersion(undefined);
          }
        } else if (!(result instanceof Promise)) {
          setVersion(result);
        }
      } catch (err) {
        setVersion(undefined);
      }
    }, Promise.resolve());
  }, []);

  // Periodically check for updates
  const UPDATE_PERIOD_MS = 300000;
  const updatePeriodMs = useHasFocus() ? UPDATE_PERIOD_MS : undefined;
  useInterval(() => {
    getUpdateInfo()
      .then((resp) => {
        setLatestVersion(resp.data);
        return null;
      })
      .catch(() => {
        // Silently ignore errors during update checks
      });
  }, updatePeriodMs);

  // Handle version checking and message processing
  useEffect(() => {
    if (latestVersion && typeof version !== 'undefined' && message === '') {
      // Always compare as string for semver
      const latest =
        typeof latestVersion.version === 'string'
          ? latestVersion.version
          : String(latestVersion.version);
      const local = typeof version === 'string' ? version : String(version);
      if (semverGt(latest, local)) {
        withElectron((electron) => electron.ipcRenderer.checkVersion());
        setNeedUpdate(true);
      } else {
        setNeedUpdate(false);
      }
    }
  }, [latestVersion, version, message]);

  // Handle update-related messages
  useEffect(() => {
    if (message === 'Update available.') {
      setNeedUpdate(true);
    }
    if (message === 'updateDownloaded') {
      setReady(true);
    }
    if (message === 'completed') {
      setMessage('');
    }
  }, [message]);

  // Listen for update messages from Electron
  useEffect(() => {
    /**
     * Handles incoming messages from the electron main process
     * @param args - Arguments passed from the IPC renderer, first argument is the message
     */
    function handleMessage(...args: unknown[]): void {
      const event = args[0] as string;
      setMessage(event);
    }
    withElectron((electron) =>
      electron.ipcRenderer.on('message', handleMessage),
    );
  }, []);

  /**
   * Notifies the user about restart and triggers application restart
   * Shows alert dialog and restarts the app after a delay
   */
  // Handler for update button click (no inline function in JSX)
  const handleUpdateClick = () => {
    setShowRestartDialog(true);
  };

  // Handler for confirming restart in dialog
  const handleRestartConfirm = () => {
    setShowRestartDialog(false);
    setTimeout(() => {
      withElectron((electron) => electron.ipcRenderer.restartApp());
    }, 1000);
  };

  const showUpdateDialog = needUpdate;

  if (!showUpdateDialog && !showRestartDialog) return null;
  return (
    <>
      <Dialog maxWidth="xl" open={showUpdateDialog}>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {ready ? (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleUpdateClick}
                sx={{ cursor: 'pointer' }}
              >
                {t('update')}
              </Button>
            ) : (
              t(message) || ''
            )}
          </DialogContentText>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showRestartDialog}
        onClose={() => setShowRestartDialog(false)}
      >
        <DialogContent>
          <DialogContentText>{t('updateRestarting')}</DialogContentText>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRestartConfirm}
            sx={{ mt: 2 }}
          >
            {t('ok')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VersionUpdater;
