/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useState } from 'react';
import { Paper, Alert, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

function Updater() {
  const [message, setMessage] = useState('');
  const { t } = useTranslation();

  function handleMessage(event: any) {
    setMessage(event);
  }

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
                  onClick={() => {
                    window.electron.ipcRenderer.restartApp();
                  }}
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
