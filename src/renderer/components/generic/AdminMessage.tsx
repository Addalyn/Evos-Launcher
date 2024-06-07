/* eslint-disable consistent-return */
/* eslint-disable promise/always-return */
// import { trackEvent } from '@aptabase/electron/renderer';
import { Alert, Paper, Typography } from '@mui/material';
import { AxiosResponse } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccountData, getPlayerInfo } from 'renderer/lib/Evos';
import EvosStore from 'renderer/lib/EvosStore';
import { strapiClient } from 'renderer/lib/strapi';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';

interface Dodges {
  user: string;
  amount: number;
  lastDodge: Date;
}

function AdminMessage() {
  const [account, setAccount] = useState<AccountData>();
  const { activeUser } = EvosStore();
  const { t } = useTranslation();
  const UPDATE_PERIOD_MS = 300000;
  const updatePeriodMs =
    useHasFocus() || !account ? UPDATE_PERIOD_MS : undefined;

  const updateAccount = useCallback(
    async (resp: AxiosResponse<AccountData, any>) => {
      const strapi = strapiClient
        .from<Dodges>('dodges')
        .select()
        .equalTo('user', activeUser?.user || '');
      const { data } = await strapi.get();

      if (data && resp.data.adminMessage === null) {
        const filteredDodges = data?.filter((dodge) => {
          const lastDodge = new Date(dodge.lastDodge);
          const currentDate = new Date();
          const diff = Math.abs(currentDate.getTime() - lastDodge.getTime());
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          return days < 7;
        });

        if (filteredDodges && filteredDodges.length > 0) {
          // trackEvent('dodges', {
          //   user: activeUser?.user as string,
          //   amount: filteredDodges.length,
          // });
          setAccount(() => {
            if (resp.data) {
              return {
                ...resp.data,
                adminMessage: t('admin.DodgeMessage', {
                  user: activeUser?.user,
                  amount: filteredDodges.length,
                }),
              };
            }
            return resp.data;
          });
        }
        if (filteredDodges && filteredDodges.length === 0) {
          setAccount(resp.data);
        }
      } else if (new Date(resp.data.lockedUntil) < new Date()) {
        setAccount(() => {
          if (resp.data) {
            return {
              ...resp.data,
              locked: false,
            };
          }
          return resp.data;
        });
      } else {
        setAccount(resp.data);
      }
    },
    [activeUser, setAccount, t],
  );

  useEffect(() => {
    if (activeUser) {
      setAccount(undefined);
      getPlayerInfo(activeUser.token)
        .then((resp) => {
          if (resp !== null) {
            if (resp.data) {
              updateAccount(resp);
            }
          }
        })
        .catch(() => {});
    }
  }, [activeUser, updateAccount]);

  useInterval(() => {
    getPlayerInfo(activeUser?.token || '')
      .then(async (resp) => {
        if (resp !== null) {
          if (resp.data) {
            updateAccount(resp);
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
              <div
                key={Math.random().toString(36).substr(2, 9)}
                style={{ paddingTop: '5px' }}
              >
                {line}
              </div>
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
              <div
                key={Math.random().toString(36).substr(2, 9)}
                style={{ paddingTop: '5px' }}
              >
                {line}
              </div>
            ))}
          </Typography>
        </Alert>
      </Paper>
    );
  }
}

export default AdminMessage;
