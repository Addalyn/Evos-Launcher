import { Paper, Alert, AlertColor } from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';
import { getNotification } from 'renderer/lib/Evos';

function NotificationMessage() {
  const [notice, setNotice] = useState<string>('');
  const [severity, setSeverity] = useState<string>('warning');
  const [special, setSpecial] = useState<string>('');
  const [specialWidth, setSpecialWidth] = useState<string>('100%');
  const [specialHeight, setSpecialHeight] = useState<string>('90px');
  const [enabled, setEnabled] = useState<boolean>();
  const [snowflakeCount, setSnowflakeCount] = useState<number>(200);
  const [snowflakeColor, setSnowflakeColor] = useState<string>('white');

  useEffect(() => {
    async function get() {
      try {
        const resp = await axios.get(
          `https://misc.addalyn.baby/special.json?rand=${Math.random()}`,
          { headers: { accept: 'application/json' } }
        );
        setSpecial(resp.data.special);
        setSpecialWidth(resp.data.width);
        setSpecialHeight(resp.data.height);
        setEnabled(resp.data.enabled);
        setSnowflakeCount(resp.data.snowflakeCount);
        setSnowflakeColor(resp.data.snowflakeColor);
      } catch (e) {
        setSpecial('');
        setEnabled(false);
      }
      getNotification()
        // eslint-disable-next-line promise/always-return
        .then((resp) => {
          setNotice(resp.data.text);
          setSeverity(resp.data.severity);
        })
        .catch(async () => {
          try {
            const resp = await axios.get(
              `https://misc.addalyn.baby/notification.json?rand=${Math.random()}`,
              { headers: { accept: 'application/json' } }
            );
            if (resp.data.text === '') {
              setNotice('');
            } else {
              setNotice(resp.data.text);
            }
            setSeverity(resp.data.severity);
          } catch (e) {
            setNotice('');
          }
        });
      setTimeout(() => {
        get();
      }, 60000 * 5);
    }

    get();
  }, []);
  return (
    <div>
      {snowflakeCount > 0 && (
        <Snowfall
          color={snowflakeColor}
          snowflakeCount={snowflakeCount}
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: 99999999,
          }}
        />
      )}
      {enabled && window.location.href.split('#')[1] === '/' && (
        <>
          {}
          <div
            style={{
              backgroundImage: `url(${special})`,
              backgroundRepeat: 'repeat-x',
              width: specialWidth,
              height: specialHeight,
            }}
          />
          <br />
        </>
      )}
      {notice !== '' && (
        <Paper elevation={5} sx={{ width: '100%', height: '65px' }}>
          <Alert
            severity={severity as AlertColor}
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
