/**
 * @fileoverview Updater component that handles application and branch updates
 * This component manages version checking, update notifications, and branch synchronization
 * for the Evos Launcher application.
 */

/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/always-return */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import {
  Alert,
  Button,
  Paper,
  Dialog,
  DialogContent,
  DialogContentText,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { Branches, getBranches, getUpdateInfo } from 'renderer/lib/Evos';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';
import { useTranslation } from 'react-i18next';
import BaseDialog from './BaseDialog';
import EvosStore from 'renderer/lib/EvosStore';
import { useNavigate } from 'react-router-dom';
import { withElectron } from 'renderer/utils/electronUtils';

/**
 * Interface for version information response
 */
interface GetVersion {
  /** The version number */
  version: number;
}

/**
 * Main Updater component that manages application and branch updates
 * Handles version checking, update notifications, and branch synchronization
 * @returns JSX element containing update dialogs and notifications
 */
function Updater() {
  const {
    setBranch,
    setNeedPatching,
    needPatching,
    setLocked,
    locked,
    branch,
    nobranchDownload,
    setNoBranchDownload,
  } = EvosStore();
  const [message, setMessage] = useState<string>('');
  const [latestVersion, setLatestVersion] = useState<GetVersion>();
  const [version, setVersion] = useState<number>();
  const [ready, setReady] = useState<boolean>(false);
  const [branchReady, setBranchReady] = useState<boolean>(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [branchesData, setBranchesData] = useState<Branches>();
  const [needUpdate, setNeedUpdate] = useState<boolean>(false);

  useEffect(() => {
    /**
     * Fetches branch information from the API
     */
    const getBranchesInfo = async (): Promise<void> => {
      const response = await getBranches();
      const { data }: { data: Branches } = response;
      setBranchesData(data);
    };

    getBranchesInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, setBranchesData]);

  /**
   * Handles incoming messages from the electron main process
   * @param args - Arguments passed from the IPC renderer, first argument is the message
   */
  function handleMessage(...args: unknown[]): void {
    const event = args[0] as string;
    setMessage(event);
  }

  /**
   * Notifies the user about restart and triggers application restart
   * Shows alert dialog and restarts the app after a delay
   */
  function notifyAndRestart(): void {
    // eslint-disable-next-line no-alert
    alert(t('updateRestarting'));
    // wait 3seconds
    setTimeout(() => {
      withElectron((electron) => electron.ipcRenderer.restartApp());
    }, 1000);
  }

  /** Update check interval in milliseconds (5 minutes) */
  const UPDATE_PERIOD_MS = 300000;
  const updatePeriodMs = useHasFocus() ? UPDATE_PERIOD_MS : undefined;

  // Periodically check for updates when window has focus
  useInterval(() => {
    getUpdateInfo()
      .then((resp) => {
        setLatestVersion(resp.data);
      })
      .catch(() => {
        // Silently ignore errors during update checks
      });
  }, updatePeriodMs);

  // Handle version checking and message processing
  useEffect(() => {
    // Check if app update is needed
    if (latestVersion && message === '') {
      withElectron(
        (electron) =>
          electron.ipcRenderer.getVersion().then((v) => setVersion(v)),
        Promise.resolve(),
      );
      if (version) {
        if (latestVersion?.version > version) {
          withElectron((electron) => electron.ipcRenderer.checkVersion());
          setNeedUpdate(true);
        } else {
          setNeedUpdate(false);
        }
      }
    }

    // Handle various message states
    if (message === 'Update available.') {
      setNeedUpdate(true);
    }
    if (message === 'updateDownloaded') {
      setReady(true);
    }
    if (message === 'completed') {
      setMessage('');
      setBranchReady(true);
      setNeedPatching(false);
      setLocked(false);
    }

    // Handle branch update scenarios
    if (message.includes('branchOutdated')) {
      if (branchesData && !locked && !needPatching && !nobranchDownload) {
        setNeedPatching(true);
        // timeout 3seconds
        setLocked(true);
        setTimeout(() => {
          withElectron((electron) =>
            electron.ipcRenderer.updateBranch(branchesData[branch]),
          );
        }, 5000);
      }
    }

    if (message.includes('branchInvalid')) {
      setNeedPatching(true);
    }
    if (message.includes('Downloading:')) {
      setNeedPatching(true);
    }

    // Handle errors
    if (message.includes('Error')) {
      setLocked(false);
      setNeedPatching(false);
      setNoBranchDownload(true);
    }
  }, [
    setNeedPatching,
    latestVersion,
    message,
    setBranch,
    version,
    t,
    setLocked,
    navigate,
    branchesData,
    branch,
    locked,
    needPatching,
    setNoBranchDownload,
    nobranchDownload,
  ]);

  withElectron((electron) => electron.ipcRenderer.on('message', handleMessage));
  return (
    <div>
      {needUpdate && (
        <Dialog maxWidth="xl" open={needUpdate}>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {ready ? (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => notifyAndRestart()}
                  sx={{
                    cursor: 'pointer',
                  }}
                >
                  {t('update')}
                </Button>
              ) : (
                message
              )}
            </DialogContentText>
          </DialogContent>
        </Dialog>
      )}
      {branchReady && (
        <BaseDialog
          title={t('settings.branchTitle')}
          content={t('settings.branchContent', {
            branch,
          })}
          dismissText={t('replay.close')}
          onDismiss={() => setBranchReady(!branchReady)}
        />
      )}
      {message === 'branchOutdated' && (
        <Paper elevation={5} sx={{ width: '100%', height: '65px' }}>
          <Alert
            severity="error"
            sx={{ display: 'flex', alignItems: 'center', height: '65px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {t(`settings.${message}`, {
                branch,
              })}
            </div>
          </Alert>
        </Paper>
      )}
      {!needUpdate && message !== '' && message !== 'branchOutdated' && (
        <Paper elevation={5} sx={{ width: '100%', height: '65px' }}>
          <Alert
            severity={
              message === 'branchInvalid' || message === 'branchOutdated'
                ? 'error'
                : 'info'
            }
            sx={{ display: 'flex', alignItems: 'center', height: '65px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {message === 'branchInvalid'
                ? t(`settings.${message}`, {
                    branch,
                  })
                : message}
            </div>
          </Alert>
        </Paper>
      )}
    </div>
  );
}

export default Updater;
