import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LinearProgress,
  Paper,
  Typography,
  Alert,
  AlertTitle,
} from '@mui/material';
import EvosStore from 'renderer/lib/EvosStore';
import { getStatus, Status } from '../../lib/Evos';

import { EvosError, processError } from '../../lib/Error';
import useInterval from '../../lib/useInterval';
import useHasFocus from '../../lib/useHasFocus';
import Server from '../atlas/Server';
import Queue from '../atlas/Queue';

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
  const { ip, setAge, activeUser } = EvosStore();

  const navigate = useNavigate();

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
    [status]
  );
  const groups = useMemo(
    () => GroupBy((g) => g.groupId, status?.groups),
    [status]
  );
  const games = useMemo(
    () => GroupBy((g) => g.server, status?.games),
    [status]
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
      .catch((e) => processError(e, setError, navigate, () => {}))
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
        .flatMap((g) => [...g.teamA, ...g.teamB])
        .map((t) => t.accountId)
    );

  return (
    <>
      {loading && <LinearProgress />}
      {error && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error.text}
        </Alert>
      )}
      {players?.size === 0 && (
        <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
          <Typography>No players online</Typography>
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
    </>
  );
}

export default StatusPage;
