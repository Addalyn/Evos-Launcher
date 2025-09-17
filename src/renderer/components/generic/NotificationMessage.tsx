import { Alert, AlertColor, Chip, Grid, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

import Snowfall from 'react-snowfall';
import WebIcon from '@mui/icons-material/Web';
import axios from 'axios';
import { getNotification } from 'renderer/lib/Evos';
import { isElectronApp } from 'renderer/utils/electronUtils';
import { useTranslation } from 'react-i18next';

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
      <Grid container spacing={2}>
        {notice !== null ? (
          <Grid size={12}>
            <Alert
              severity={severity as AlertColor} // The 'severity' prop is cast to AlertColor type
              sx={{ display: 'flex', alignItems: 'center' }} // Styling for flex display and center alignment
            >
              {notice}
            </Alert>
          </Grid>
        ) : (
          <Grid size={12} style={{ height: '48px' }}>
            {' '}
          </Grid>
        )}
      </Grid>

      {/* Environment indicator */}
      {!isElectronApp() && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            margin: '1em',
            alignItems: 'center',
          }}
        >
          <div>
            <Chip
              label="Web Browser"
              icon={<WebIcon />}
              color="secondary"
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              Some features may be unavailable in web mode
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationMessage;
