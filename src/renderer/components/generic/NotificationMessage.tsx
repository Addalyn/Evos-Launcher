import { Paper, Alert, AlertColor } from '@mui/material';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Snowfall from 'react-snowfall';

import { getNotification } from 'renderer/lib/Evos';

function NotificationMessage() {
  const [notice, setNotice] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string>('');
  const [special, setSpecial] = useState<string>('');
  const [specialWidth, setSpecialWidth] = useState<string>('100%');
  const [specialHeight, setSpecialHeight] = useState<string>('90px');
  const [enabled, setEnabled] = useState<boolean>();
  const [snowflakeCount, setSnowflakeCount] = useState<number>(200);
  const [snowflakeColor, setSnowflakeColor] = useState<string>('white');
  const { i18n } = useTranslation();

  useEffect(() => {
    async function get() {
      try {
        const resp = await axios.get(
          `https://misc.evos.live/special.json?rand=${Math.random()}`,
          { headers: { accept: 'application/json' } },
        );
        setSpecial(resp.data.specialv2);
        setSpecialWidth(resp.data.width);
        setSpecialHeight(resp.data.height);
        setEnabled(resp.data.enabledv2);
        setSnowflakeCount(resp.data.snowflakeCount);
        setSnowflakeColor(resp.data.snowflakeColor);
      } catch (e) {
        setSpecial('');
        setEnabled(false);
      }
      getNotification(i18n.language ?? 'en')
        // eslint-disable-next-line promise/always-return
        .then((resp) => {
          setNotice(resp.data.text);
          setSeverity(resp.data.severity);
        })
        .catch(async () => {
          setNotice('');
        });
      setTimeout(() => {
        get();
      }, 60000 * 5);
    }

    get();
  }, [i18n.language]);
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
        <div
          style={{
            backgroundImage: `url(${special})`,
            backgroundRepeat: 'repeat-x',
            width: specialWidth,
            height: specialHeight,
          }}
        />
      )}
      {notice !== null && (
        <Paper elevation={0} sx={{ width: '100%' }}>
          <Alert
            severity={severity as AlertColor}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {notice}
          </Alert>
        </Paper>
      )}
    </div>
  );
}

export default NotificationMessage;
