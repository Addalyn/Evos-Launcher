import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LinearProgress,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import EvosStore from 'renderer/lib/EvosStore';
import { Trans, useTranslation } from 'react-i18next';
import { GridExpandMoreIcon } from '@mui/x-data-grid';
import { getPlayerData, getStatus, PlayerData, Status } from '../../lib/Evos';

import { EvosError, processError } from '../../lib/Error';
import useInterval from '../../lib/useInterval';
import useHasFocus from '../../lib/useHasFocus';
import Server from '../atlas/Server';
import Queue from '../atlas/Queue';
import TrustBar from '../generic/TrustBar';
import Player from '../atlas/Player';

function GroupBy<V, K>(key: (item: V) => K, list?: V[]) {
  return list?.reduce((res, p) => {
    res.set(key(p), p);
    return res;
  }, new Map<K, V>());
}

const UPDATE_PERIOD_MS = 20000;

function StatusPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<EvosError>();
  const [status, setStatus] = useState<Status>();
  const [updateTime, setUpdateTime] = useState<Date>();
  const [expanded, setExpanded] = useState(false);
  const { ip, setAge, activeUser } = EvosStore();
  const { t } = useTranslation();
  const [playerInfoList, setPlayerInfoList] = useState<PlayerData[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchPlayerInfo = async () => {
      try {
        const players = [
          'BabyAddalyn#000',
          'Memedelyn#805',
          'zheneq#412',
          'Lucas#210',
          'cEEKAY#828',
        ];
        const infoList = await Promise.all(
          players.map((player) => getPlayerData(activeUser!.token, player)),
        );
        setPlayerInfoList(
          infoList.map((info) => info.data).filter((info) => info !== null),
        );
      } catch (error1) {
        setPlayerInfoList([]);
      }
    };

    fetchPlayerInfo();
  }, [activeUser]);

  const legend: { [key: string]: string } = {
    'BabyAddalyn#000': 'Special',
    'Memedelyn#805': 'MVP',
    'zheneq#412': 'Developer',
    'Lucas#210': 'Tournament Champion',
    'cEEKAY#828': 'Nitro Booster',
  };
  useEffect(() => {
    setTimeout(() => {
      if (
        ip === undefined ||
        ip === null ||
        ip === '' ||
        activeUser === null ||
        activeUser?.token === ''
      ) {
        navigate('/login');
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ip, activeUser]);

  const players = useMemo(
    () => GroupBy((p) => p.accountId, status?.players),
    [status],
  );
  const groups = useMemo(
    () => GroupBy((g) => g.groupId, status?.groups),
    [status],
  );
  const games = useMemo(
    () => GroupBy((g) => g.server, status?.games),
    [status],
  );

  const updatePeriodMs =
    useHasFocus() || !status ? UPDATE_PERIOD_MS : undefined;

  useInterval(() => {
    // eslint-disable-next-line promise/catch-or-return
    getStatus()
      // eslint-disable-next-line promise/always-return
      .then((resp) => {
        setError(undefined);
        setStatus(resp.data);
        setUpdateTime(new Date());
        setAge(0);
      })
      .catch((e) => processError(e, setError, navigate, () => {}, t))
      .then(() => setLoading(false));
  }, updatePeriodMs);

  useInterval(() => {
    if (updateTime) {
      setAge(new Date().getTime() - updateTime.getTime());
    }
  }, 5000);

  const queuedGroups = new Set(status?.queues?.flatMap((q) => q.groupIds));
  const notQueuedGroups =
    groups && [...groups.keys()].filter((g) => !queuedGroups.has(g));
  const inGame =
    games &&
    new Set(
      [...games.values()]
        .filter((g) => g.status !== 'Stopped') // Filter out games with status 'Stopped'
        .flatMap((g) => [...g.teamA, ...g.teamB])
        .map((p) => p.accountId),
    );

  return (
    <>
      {status?.factionsEnabled && (
        <TrustBar factionsData={status?.factionsData} />
      )}
      {loading && <LinearProgress />}
      {error && (
        <Alert severity="error">
          <AlertTitle>{t('errors.error')}</AlertTitle>
          {error.text}
        </Alert>
      )}
      {players?.size === 0 && (
        <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
          <Typography>{t('noPlayers')}</Typography>
        </Paper>
      )}
      {status &&
        groups &&
        players &&
        status.queues.map((q) => (
          <Queue
            key={q.type}
            queueInfo={q}
            groupData={groups}
            playerData={players}
          />
        ))}
      {notQueuedGroups && groups && players && inGame && (
        <Queue
          key="not_queued"
          queueInfo={{ type: 'Not queued', groupIds: notQueuedGroups }}
          groupData={groups}
          playerData={players}
          hidePlayers={inGame}
        />
      )}
      {status &&
        players &&
        games &&
        status.servers
          .sort((s1, s2) => s1.name.localeCompare(s2.name))
          .map((s, i) => (
            <Server
              key={i.valueOf()}
              info={s}
              game={games.get(s.id)}
              playerData={players}
            />
          ))}
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Accordion
          expanded={expanded}
          onChange={() => setExpanded((value) => !value)}
        >
          <AccordionSummary expandIcon={<GridExpandMoreIcon />}>
            <Typography>{t('effectLegendTitle')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="caption" component="h2">
              <Trans i18nKey="effectLegend" components={{ 1: <br /> }} />
            </Typography>
            <br />
            <Grid container spacing={1}>
              {playerInfoList.map((info) => (
                <Grid item xs={4} key={`player-${info.handle}`}>
                  <Player info={info} disableSkew title={legend[info.handle]} />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </>
  );
}

export default StatusPage;
