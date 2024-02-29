/* eslint-disable promise/always-return */
import { Alert, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccountData, getPlayerInfo } from 'renderer/lib/Evos';
import EvosStore from 'renderer/lib/EvosStore';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';

function AdminMessage() {
  const [account, setAccount] = useState<AccountData>();
  const { activeUser } = EvosStore();
  const { t } = useTranslation();
  const UPDATE_PERIOD_MS = 300000;
  const updatePeriodMs =
    useHasFocus() || !account ? UPDATE_PERIOD_MS : undefined;

  useEffect(() => {
    if (activeUser) {
      getPlayerInfo(activeUser.token)
        .then((resp) => {
          if (resp !== null) {
            setAccount(resp.data);
            if (resp.data) {
              if (new Date(resp.data.lockedUntil) < new Date()) {
                setAccount((prev) => {
                  if (prev) {
                    return { ...prev, locked: false };
                  }
                  return prev;
                });
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [activeUser]);

  useInterval(() => {
    getPlayerInfo(activeUser?.token || '')
      .then((resp) => {
        if (resp !== null) {
          setAccount(resp.data);
          if (resp.data) {
            if (new Date(resp.data.lockedUntil) < new Date()) {
              setAccount((prev) => {
                if (prev) {
                  return { ...prev, locked: false };
                }
                return prev;
              });
            }
          }
        }
      })
      .catch(() => {});
  }, updatePeriodMs);

  if (!account) {
    return null;
  }

  if (account.adminMessage === '' && !account.locked) {
    return null;
  }

  if (account.locked) {
    return (
      <Paper elevation={0} sx={{ width: '100%' }}>
        <Alert severity="error" sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h3">{t('admin.Locked')}</Typography>
          <Typography variant="body1">
            {t('admin.LockedUntill')}{' '}
            {new Date(account.lockedUntil).toLocaleString()}
          </Typography>
          <Typography variant="body1" sx={{ marginTop: '5px' }}>
            {account.lockedReason.split('\n').map((line) => (
              <div key={Math.random().toString(36).substr(2, 9)}>{line}</div>
            ))}
          </Typography>
        </Alert>
      </Paper>
    );
  }

  if (account.adminMessage) {
    return (
      <Paper elevation={0} sx={{ width: '100%' }}>
        <Alert severity="error" sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h3">{t('admin.Message')}</Typography>
          <Typography variant="body1">
            {account.adminMessage.split('\n').map((line) => (
              <div key={Math.random().toString(36).substr(2, 9)}>{line}</div>
            ))}
          </Typography>
        </Alert>
      </Paper>
    );
  }
}

export default AdminMessage;
