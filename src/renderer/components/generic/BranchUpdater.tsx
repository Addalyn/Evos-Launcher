import { useEffect, useState } from 'react';
import { Paper, Alert } from '@mui/material';
import BaseDialog from './BaseDialog';
import { withElectron } from 'renderer/utils/electronUtils';
import { useTranslation } from 'react-i18next';
import EvosStore from 'renderer/lib/EvosStore';
import { Branches, getBranches } from 'renderer/lib/Evos';

function BranchUpdater() {
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
  const [message, setMessage] = useState('');
  const [branchesData, setBranchesData] = useState<Branches>();
  const [branchReady, setBranchReady] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const getBranchesInfo = async () => {
      const response = await getBranches();
      const { data } = response;
      setBranchesData(data);
    };
    getBranchesInfo();
  }, [branch, setBranchesData]);

  useEffect(() => {
    function handleMessage(...args: unknown[]) {
      const event = args[0] as string;
      setMessage(event);
    }
    withElectron((electron) =>
      electron.ipcRenderer.on('message', handleMessage),
    );
    return () => {
      // Optionally remove listener if needed
    };
  }, []);

  useEffect(() => {
    if (message === 'completed') {
      setMessage('');
      setBranchReady(true);
      setNeedPatching(false);
      setLocked(false);
    }
    if (message.includes('branchOutdated')) {
      if (branchesData && !locked && !needPatching && !nobranchDownload) {
        setNeedPatching(true);
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
    if (message.includes('Error')) {
      setLocked(false);
      setNeedPatching(false);
      setNoBranchDownload(true);
    }
  }, [
    message,
    setNeedPatching,
    setBranch,
    setLocked,
    setNoBranchDownload,
    branchesData,
    branch,
    locked,
    needPatching,
    nobranchDownload,
  ]);

  return (
    <>
      {branchReady && (
        <BaseDialog
          title={t('settings.branchTitle')}
          content={t('settings.branchContent', { branch })}
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
              {t(`settings.${message}`, { branch })}
            </div>
          </Alert>
        </Paper>
      )}
      {message !== '' &&
        message !== 'updateDownloaded' &&
        message !== 'Update available.' &&
        message !== 'completed' &&
        message !== 'checkUpdate' &&
        message !== 'branchOutdated' && (
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
                  ? t(`settings.${message}`, { branch })
                  : message}
              </div>
            </Alert>
          </Paper>
        )}
    </>
  );
}

export default BranchUpdater;
