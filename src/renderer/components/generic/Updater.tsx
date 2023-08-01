import { useState } from 'react';
import { Paper, Alert } from '@mui/material';

function Updater() {
  const [message, setMessage] = useState('');

  function handleMessage(event: any) {
    setMessage(event);
  }

  window.electron.ipcRenderer.on('message', handleMessage);
  return (
    <div>
      {message !== '' && (
        <Paper elevation={3}>
          <Alert severity="info">{message}</Alert>
        </Paper>
      )}
    </div>
  );
}

export default Updater;
