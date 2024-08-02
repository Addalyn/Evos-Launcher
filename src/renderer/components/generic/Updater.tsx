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

interface getVersion {
  version: number;
}

function Updater() {
  const {
    setBranch,
    setNeedPatching,
    needPatching,
    setLocked,
    locked,
    branch,
  } = EvosStore();
  const [message, setMessage] = useState('');
  const [latestVersion, setLatestVersion] = useState<getVersion>();
  const [version, setVersion] = useState<number>();
  const [ready, setReady] = useState<boolean>(false);
  const [branchReady, setBranchReady] = useState<boolean>(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [branchesData, setBranchesData] = useState<Branches>();
  const [needUpdate, setNeedUpdate] = useState<boolean>(false);

  useEffect(() => {
    const getBranchesInfo = async () => {
      const response = await getBranches();
      const { data }: { data: Branches } = response;
      setBranchesData(data);
    };

    getBranchesInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, setBranchesData]);

  function handleMessage(event: any) {
    setMessage(event);
  }

  function notifyAndRestart() {
    // eslint-disable-next-line no-alert
    alert(t('updateRestarting'));
    // wait 3seconds
    setTimeout(() => {
      window.electron.ipcRenderer.restartApp();
    }, 1000);
  }

  const UPDATE_PERIOD_MS = 300000;
  const updatePeriodMs = useHasFocus() ? UPDATE_PERIOD_MS : undefined;

  useInterval(() => {
    getUpdateInfo()
      .then((resp) => {
        setLatestVersion(resp.data);
      })
      .catch(() => {});
  }, updatePeriodMs);

  useEffect(() => {
    if (latestVersion && message === '') {
      window.electron.ipcRenderer.getVersion().then((v) => setVersion(v));
      if (version) {
        if (latestVersion?.version > version) {
          window.electron.ipcRenderer.checkVersion();
          setNeedUpdate(true);
        } else {
          setNeedUpdate(false);
        }
      }
    }
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
    if (message.includes('branchOutdated')) {
      if (branchesData && !locked && !needPatching) {
        // timeout 3seconds
        setLocked(true);
        setTimeout(() => {
          window.electron.ipcRenderer.updateBranch(branchesData[branch]);
        }, 3000);
      }
      setNeedPatching(true);
    }

    if (message.includes('branchInvalid')) {
      setNeedPatching(true);
    }
    if (message.includes('Downloading:')) {
      setNeedPatching(true);
    }
    // Error
    if (message.includes('Error')) {
      setLocked(false);
      setNeedPatching(false);
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
  ]);

  window.electron.ipcRenderer.on('message', handleMessage);
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
