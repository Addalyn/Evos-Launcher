import {
  Dialog,
  DialogContent,
  TextField,
  DialogActions,
  DialogTitle,
  Avatar,
  InputAdornment,
  Alert,
  Button,
  Paper,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import EvosStore from 'renderer/lib/EvosStore';
import { logoSmall } from 'renderer/lib/Resources';
import { strapiClient } from 'renderer/lib/strapi';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';

interface FindCode {
  id: number;
  discordid: number;
  discordname: string;
  linkcode: string;
}

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
  const [codePopup, setCodePopup] = useState(false);
  const [code, setCode] = useState('');
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
      window.electron?.ipcRenderer?.linkAccount(activeUser);
    }
  };

  const goToDiscord = () => {
    navigate('/discord');
  };

  const linkWithCode = () => {
    if (activeUser) {
      setCodePopup(true);
    }
  };

  const handleCloseDialog = () => {
    setCodePopup(false);
  };

  const handleSubmit = async () => {
    if (activeUser) {
      const strapi = strapiClient
        .from<FindCode>(`linkcodes/find/${code}`)
        .select();

      const { data, error } = await strapi.get();

      if (error?.status === 502) {
        setOffline(true);
        return;
      }
      if (data === null) {
        return;
      }

      if (data.length > 0) {
        strapiClient.from('discords').create({
          playername: activeUser.handle,
          discordid: data[0].discordid,
          discordname: data[0].discordname,
        });

        strapiClient.from(`linkcodes/delete/${code}`).deleteOne('');
        setDiscordId(data[0].discordid);
        setCode('');
        setCodePopup(false);
      }

      // fetchData();
    }
  };

  if (discordId !== 0 && !offline) return null;

  return (
    <>
      <Paper elevation={0} sx={{ width: '100%' }}>
        {offline ? (
          <Alert
            severity="error"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
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
            <Button variant="outlined" color="primary" onClick={linkWithCode}>
              {t('linkwithcode')}
            </Button>
            &nbsp;&nbsp;
            <Button variant="outlined" color="primary" onClick={goToDiscord}>
              {t('joindiscordButton')}
            </Button>
          </Alert>
        )}
      </Paper>
      <Dialog
        open={codePopup}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('linkwithcode')}</DialogTitle>
        <DialogContent style={{ overflowX: 'hidden' }}>
          <TextField
            placeholder={t('entercode')}
            value={code}
            style={{ flexGrow: 1, marginRight: '1em' }}
            variant="outlined"
            onChange={(e: {
              target: { value: React.SetStateAction<string> };
            }) => setCode(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Avatar
                    alt="logo"
                    variant="square"
                    src={logoSmall()}
                    sx={{
                      flexShrink: 1,
                      width: 40,
                      height: 40,
                    }}
                  />
                </InputAdornment>
              ),
            }}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmit} color="primary">
            {t('submit')}
          </Button>
          <Button onClick={handleCloseDialog}>{t('replay.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default LinkDiscord;
