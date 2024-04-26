import { Alert, Button, Paper } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import EvosStore from 'renderer/lib/EvosStore';
import { strapiClient } from 'renderer/lib/strapi';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';

const fetchInfo = async (playername: string) => {
  try {
    const strapi = strapiClient.from('discords').select();

    strapi.equalTo('playername', playername);

    const { data, error } = await strapi.get();

    if (error?.status === 502) {
      return -1;
    }
    if (data?.length === 0) {
      return 0;
    }
    return (data && data[0]?.discordid) || 0;
  } catch (error) {
    return 0;
  }
};

function LinkDiscord() {
  const { activeUser, discordId, setDiscordId } = EvosStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const UPDATE_PERIOD_MS = 300000;
  const updatePeriodMs =
    useHasFocus() || !activeUser ? UPDATE_PERIOD_MS : undefined;
  const [offline, setOffline] = useState(false);

  const fetchData = useCallback(async () => {
    const data = await fetchInfo(activeUser?.handle || '');

    if (data === -1) {
      setOffline(true);
      return;
    }
    setOffline(false);
    setDiscordId(data);
  }, [activeUser, setDiscordId]);

  useInterval(() => {
    fetchData();
  }, updatePeriodMs);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const linkDiscord = () => {
    if (activeUser) {
      window.electron.ipcRenderer.linkAccount(activeUser);
    }
  };

  const goToDiscord = () => {
    navigate('/discord');
  };

  if (discordId !== 0 && !offline) return null;

  return (
    <Paper elevation={0} sx={{ width: '100%' }}>
      {offline ? (
        <Alert severity="error" sx={{ display: 'flex', alignItems: 'center' }}>
          {t('APIOFFLINE')}
        </Alert>
      ) : (
        <Alert
          severity="warning"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Trans i18nKey="LINKDISCORD" components={{ 1: <br /> }} />
          <br />
          <br />
          <Button variant="outlined" color="primary" onClick={linkDiscord}>
            {t('linkdiscordButton')}
          </Button>
          &nbsp;&nbsp;
          <Button variant="outlined" color="primary" onClick={goToDiscord}>
            {t('joindiscordButton')}
          </Button>
        </Alert>
      )}
    </Paper>
  );
}

export default LinkDiscord;
