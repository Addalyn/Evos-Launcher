import { useEffect, useState } from 'react';
import { Paper, Alert } from '@mui/material';
import BaseDialog from './BaseDialog';
import { withElectron } from 'renderer/utils/electronUtils';
import { useTranslation } from 'react-i18next';
import EvosStore from 'renderer/lib/EvosStore';
import { Branches, getBranches } from 'renderer/lib/Evos';
import useNavbar from './navbar/useNavbar';

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
    activeUser,
  } = EvosStore();

  const { activeGames } = useNavbar();
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
    // eslint-disable-next-line no-undef
    let intervalId: string | number | NodeJS.Timeout | undefined;

    if (branch !== '') {
      const getBranchesInfo = async () => {
        const response = await getBranches();
        const { data }: { data: Branches } = response;
        if (data && !locked) {
          // time out 3seconds
          setTimeout(() => {
            window.electron.ipcRenderer.checkBranch(data[branch]);
          }, 5000);
        }
      };

      getBranchesInfo();

      // check it every 5minutes when not in game
      if (!activeGames[activeUser?.user as string]) {
        intervalId = setInterval(getBranchesInfo, 5 * 60 * 1000);
      } else {
        clearInterval(intervalId);
      }
    }
    return () => clearInterval(intervalId);
  }, [activeGames, activeUser?.user, branch, locked, needPatching, t]);

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
