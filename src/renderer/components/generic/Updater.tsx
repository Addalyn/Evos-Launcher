/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/always-return */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useEffect, useState } from 'react';
import { Paper, Alert, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';
import { getUpdateInfo } from 'renderer/lib/Evos';

interface getVersion {
  version: number;
}

function Updater() {
  const [message, setMessage] = useState('');
  const [latestVersion, setLatestVersion] = useState<getVersion>();
  const [version, setVersion] = useState<number>();
  const { t } = useTranslation();

  function handleMessage(event: any) {
    setMessage(event);
  }

  function notifyAndRestart() {
    // eslint-disable-next-line no-alert
    alert(t('updateRestarting'));
    // wait 3seconds
    setTimeout(() => {
      window.electron.ipcRenderer.restartApp();
    }, 3000);
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
        }
      }
    }
  }, [latestVersion, message, version]);

  window.electron.ipcRenderer.on('message', handleMessage);
  return (
    <div>
      {message !== '' && (
        <Paper elevation={5} sx={{ width: '100%', height: '65px' }}>
          <Alert
            severity="info"
            sx={{ display: 'flex', alignItems: 'center', height: '65px' }}
          >
            {message === t('Downloaded') ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {message}
              </div>
            )}
          </Alert>
        </Paper>
      )}
    </div>
  );
}

export default Updater;
