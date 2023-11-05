/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useState } from 'react';
import { Paper, Alert, Button } from '@mui/material';

function Updater() {
  const [message, setMessage] = useState('');

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
            {message ===
            'Update downloaded, Restart Evos Launcher to apply the update.' ? (
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
                  Update downloaded, Click to restart Evos Launcher and apply
                  the update.
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
