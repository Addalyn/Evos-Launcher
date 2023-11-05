import { Paper, Alert } from '@mui/material';
import { useEffect, useState } from 'react';
import { getNotification } from 'renderer/lib/Evos';

function NotificationMessage() {
  const [notice, setNotice] = useState<string>('');

  useEffect(() => {
    async function get() {
      getNotification()
        // eslint-disable-next-line promise/always-return
        .then((resp) => {
          setNotice(resp.data.text);
        })
        .catch(() => setNotice(''));
      setTimeout(() => {
        get();
      }, 60000);
    }

    get();
  }, []);

  return (
    <div>
      {notice !== '' && (
        <Paper elevation={5} sx={{ width: '100%', height: '65px' }}>
          <Alert
            severity="warning"
            sx={{ display: 'flex', alignItems: 'center', height: '65px' }}
          >
            {notice}
          </Alert>
        </Paper>
      )}
    </div>
  );
}

export default NotificationMessage;
