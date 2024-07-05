import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import { PlayerData, Status, WS_URL, getPlayerData } from '../../lib/Evos';
import { Trans, useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';

import { EvosError } from '../../lib/Error';
import EvosStore from 'renderer/lib/EvosStore';
import { GridExpandMoreIcon } from '@mui/x-data-grid';
import Player from '../atlas/Player';
import Queue from '../atlas/Queue';
import Server from '../atlas/Server';
import TrustBar from '../generic/TrustBar';
import { useNavigate } from 'react-router-dom';
import useWebSocket from 'react-use-websocket';

function GroupBy<V, K>(key: (item: V) => K, list?: V[]) {
  return list?.reduce((res, p) => {
    res.set(key(p), p);
    return res;
  }, new Map<K, V>());
}

function StatusPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<EvosError>();
  const [status, setStatus] = useState<Status>();
  const [expanded, setExpanded] = useState(false);
  const { ip, activeUser } = EvosStore();
  const { t } = useTranslation();
  const [playerInfoList, setPlayerInfoList] = useState<PlayerData[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchPlayerInfo = async () => {
      try {
        const players = [
          'BabyAddalyn#000',
          'DrJester#888',
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
    'BabyAddalyn#000': 'Mentor',
    'DrJester#888': 'Special',
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

  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
    share: true,
    queryParams: { username: encodeURIComponent(activeUser?.handle as string) },
    onMessage: (event) => {
      const parsedMessage: Status = JSON.parse(event.data);
      if (parsedMessage.error !== undefined) {
        setError({
          text: t('errors.serverOffline'),
          description: 'Try Again Later',
        });
        setStatus(undefined);
        setLoading(true);
      } else {
        setError(undefined);
        setLoading(false);
        setStatus(parsedMessage);
      }
    },
    shouldReconnect: () => true,
  });

  useEffect(() => {
    // eslint-disable-next-line no-undef
    let retryTimeout: string | number | NodeJS.Timeout | undefined;

    const handleWebSocketInit = () => {
      if (readyState === WebSocket.OPEN) {
        sendJsonMessage({
          type: 'INIT',
          username: encodeURIComponent(activeUser?.handle as string),
        });
      } else if (readyState === WebSocket.CLOSED) {
        setStatus(undefined);
        setLoading(true);
        setError({
          text: t('errors.serverOffline'),
          description: 'Try Again Later',
        });
        retryTimeout = setTimeout(() => {
          handleWebSocketInit();
        }, 3000); // Retry every 3 seconds until connected
      }
    };

    handleWebSocketInit();

    return () => {
      clearTimeout(retryTimeout);
      if (readyState === WebSocket.OPEN) {
        sendJsonMessage({
          type: 'DISCONNECT',
          username: encodeURIComponent(activeUser?.handle as string),
        });
      }
    };
  }, [activeUser, readyState, sendJsonMessage, t]);

  useEffect(() => {
    if (readyState === WebSocket.CLOSED) {
      setStatus(undefined);
      setLoading(true);
      setError({
        text: t('errors.serverOffline'),
        description: 'Try Again Later',
      });
    }
  }, [readyState, t]);

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
