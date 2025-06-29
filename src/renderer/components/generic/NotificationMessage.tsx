import {
  Alert,
  AlertColor,
  FormControl,
  Select,
  MenuItem,
  Box,
  Grid,
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import Snowfall from 'react-snowfall';

import { getNotification } from 'renderer/lib/Evos';
import EvosStore from 'renderer/lib/EvosStore';

interface ReadOnlyURLSearchParams extends URLSearchParams {
  append: never;
  set: never;
  delete: never;
  sort: never;
}

function NotificationMessage() {
  const { stats, setStats } = EvosStore();
  const [notice, setNotice] = useState<string | null>(null);
  const [severity, setSeverity] = useState<string>('');
  const [special, setSpecial] = useState<string>('');
  const [specialWidth, setSpecialWidth] = useState<string>('100%');
  const [specialHeight, setSpecialHeight] = useState<string>('90px');
  const [enabled, setEnabled] = useState<boolean>();
  const [snowflakeCount, setSnowflakeCount] = useState<number>(200);
  const [snowflakeColor, setSnowflakeColor] = useState<string>('white');
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { search } = useLocation();

  const searchParams = useMemo(
    () => new URLSearchParams(search) as ReadOnlyURLSearchParams,
    [search],
  );

  useEffect(() => {
    if (
      location.pathname === '/stats' &&
      stats === 'https://stats-v1.evos.live/'
    ) {
      navigate('/statsv1');
    }
    if (
      location.pathname === '/previousgames' &&
      stats === 'https://stats-v1.evos.live/'
    ) {
      navigate('/previousgamesv1');
    }
    if (
      location.pathname === '/playerstats' &&
      stats === 'https://stats-v1.evos.live/'
    ) {
      navigate(`/playerstatsv1?${searchParams.toString()}`);
    }
    if (
      location.pathname === '/statsv1' &&
      stats === 'https://stats-production.evos.live/'
    ) {
      navigate('/stats');
    }
    if (
      location.pathname === '/previousgamesv1' &&
      stats === 'https://stats-production.evos.live/'
    ) {
      navigate('/previousgames');
    }
    if (
      location.pathname === '/playerstatsv1' &&
      stats === 'https://stats-production.evos.live/'
    ) {
      navigate(`/playerstats?${searchParams.toString()}`);
    }
  }, [location, navigate, search, searchParams, stats]);

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

  const handleChange = (event: { target: { value: string } }) => {
    setStats(event.target.value);
  };

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
      <Grid container>
        {notice !== null ? (
          <Grid item xs={12}>
            <Alert
              severity={severity as AlertColor} // The 'severity' prop is cast to AlertColor type
              sx={{ display: 'flex', alignItems: 'center' }} // Styling for flex display and center alignment
            >
              {notice}
            </Alert>
          </Grid>
        ) : (
          <Grid item xs={12} style={{ height: '48px' }}>
            {' '}
          </Grid>
        )}
        {(location.pathname === '/stats' ||
          location.pathname === '/statsv1' ||
          location.pathname === '/playerstats' ||
          location.pathname === '/playerstatsv1' ||
          location.pathname === '/previousgames' ||
          location.pathname === '/previousgamesv1') && (
          <Grid item xs={notice ? 3 : 12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                position: 'absolute',
                top: -13,
                right: 0,
                margin: 2,
              }}
            >
              <FormControl sx={{ minWidth: 120 }} size="small">
                <Select
                  labelId="stats-range-label"
                  id="stats-range-select"
                  value={stats}
                  onChange={handleChange}
                >
                  <MenuItem value="https://stats-production.evos.live/">
                    2025 (New)
                  </MenuItem>
                  <MenuItem value="https://stats-v1.evos.live/">
                    2023-2024 (Old)
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>
        )}
      </Grid>
    </div>
  );
}

export default NotificationMessage;
