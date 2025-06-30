/**
 * @fileoverview StatusPage component for displaying real-time game status
 *
 * This file contains the StatusPage component which displays:
 * - Current online players and their groups
 * - Active game queues and matchmaking status
 * - Running game servers and ongoing matches
 * - Trust/faction system status if enabled
 * - Effect legend showing notable players and their roles
 *
 * The component uses WebSocket for real-time updates and requires user authentication.
 *
 * @author Evos Launcher Team
 * @version 1.0.0
 */

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Grid,
  Paper,
  Skeleton,
  Typography,
  Chip,
} from '@mui/material';
import { PlayerData, Status, WS_URL, getPlayerData } from '../../lib/Evos';
import { Trans, useTranslation } from 'react-i18next';
import React, { useEffect, useMemo, useState } from 'react';
import WebIcon from '@mui/icons-material/Web';

import { EvosError } from '../../lib/Error';
import EvosStore from 'renderer/lib/EvosStore';
import { GridExpandMoreIcon } from '@mui/x-data-grid';
import Player from '../atlas/Player';
import Queue from '../atlas/Queue';
import Server from '../atlas/Server';
import TrustBar from '../generic/TrustBar';
import { useNavigate } from 'react-router-dom';
import useWebSocket from 'react-use-websocket';
import { isElectronApp } from 'renderer/utils/electronUtils';

/**
 * Groups an array of items by a specified key function
 * @template V The type of items in the array
 * @template K The type of the key used for grouping
 * @param key Function that extracts the grouping key from each item
 * @param list Optional array of items to group
 * @returns A Map where keys are the grouping keys and values are the items
 */
function GroupBy<V, K>(key: (item: V) => K, list?: V[]): Map<K, V> | undefined {
  return list?.reduce((res, p) => {
    res.set(key(p), p);
    return res;
  }, new Map<K, V>());
}

/**
 * StatusPage component displays the current game status including players, queues, and servers
 * Shows real-time game information through WebSocket connection
 * Requires user authentication to access
 *
 * @returns JSX element containing the status page interface
 */
function StatusPage(): React.ReactElement {
  /** Loading state for the page */
  const [loading, setLoading] = useState<boolean>(true);

  /** Error state containing error information if any */
  const [error, setError] = useState<EvosError>();

  /** Current server status information */
  const [status, setStatus] = useState<Status>();

  /** Expansion state for the effect legend accordion */
  const [expanded, setExpanded] = useState<boolean>(false);

  /** Store containing user settings and authentication data */
  const { ip, activeUser, gameExpanded } = EvosStore();

  /** Translation function for internationalization */
  const { t } = useTranslation();

  /** List of player information for the legend section */
  const [playerInfoList, setPlayerInfoList] = useState<PlayerData[]>([]);

  /** Navigation function for routing */
  const navigate = useNavigate();

  /**
   * Effect to fetch player information for the legend section
   * Fetches data for specific notable players and their roles
   */
  useEffect(() => {
    /**
     * Fetches player information for predetermined special players
     * These players are shown in the legend with their special roles
     */
    const fetchPlayerInfo = async (): Promise<void> => {
      try {
        /** List of notable players to display in the legend */
        const players: string[] = [
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

  /** Mapping of player handles to their special roles/titles */
  const legend: Record<string, string> = {
    'BabyAddalyn#000': 'Mentor',
    'DrJester#888': 'Special',
    'Memedelyn#805': 'MVP',
    'zheneq#412': 'Developer',
    'Lucas#210': 'Tournament Champion',
    'cEEKAY#828': 'Nitro Booster',
  };

  /**
   * Effect to handle authentication and redirect to login if necessary
   * Checks if user has valid IP and authentication token
   */
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

  // Use all players, groups, and games as in the old working version
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

  /** WebSocket connection for real-time status updates */
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
        // Only update status if it actually changed (shallow compare top-level keys)
        setStatus((prev) => {
          if (!prev) return parsedMessage;
          const prevKeys = Object.keys(prev);
          const newKeys = Object.keys(parsedMessage);
          if (prevKeys.length !== newKeys.length) return parsedMessage;
          const changed = prevKeys.some(
            (key) =>
              prev[key as keyof Status] !== parsedMessage[key as keyof Status],
          );
          return changed ? parsedMessage : prev;
        });
      }
    },
    shouldReconnect: () => true,
  });

  /**
   * Effect to handle WebSocket connection initialization and cleanup
   * Manages connection state and automatic reconnection
   */
  useEffect(() => {
    // eslint-disable-next-line no-undef
    let retryTimeout: string | number | NodeJS.Timeout | undefined;

    /**
     * Handles WebSocket connection initialization and retry logic
     * Sends appropriate messages based on connection state
     */
    const handleWebSocketInit = (): void => {
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

  /**
   * Effect to handle WebSocket disconnection
   * Sets appropriate error state when connection is lost
   */
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

  /** Set of group IDs that are currently in queue */
  const queuedGroups = new Set(status?.queues?.flatMap((q) => q.groupIds));

  /** Array of group IDs that are not currently in any queue */
  const notQueuedGroups =
    groups && [...groups.keys()].filter((g) => !queuedGroups.has(g));

  /** Set of account IDs for players currently in active games */
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
      {/* Environment indicator */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          margin: '1em',
          alignItems: 'center',
        }}
      >
        {!isElectronApp() && (
          <>
            <Chip
              label="Web Browser"
              icon={<WebIcon />}
              color="secondary"
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              Some features may be unavailable in web mode
            </Typography>
          </>
        )}
      </div>

      {error && (
        <Alert severity="error">
          <AlertTitle>{t('errors.error')}</AlertTitle>
          {error.text}
        </Alert>
      )}
      {loading && (
        <>
          <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
            <Skeleton variant="rectangular" width="100%" height={56} />
          </Paper>
          <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
            <Skeleton variant="rectangular" width="100%" height={200} />
          </Paper>
        </>
      )}
      {status?.factionsEnabled && (
        <TrustBar factionsData={status?.factionsData} />
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
            key={q.subtype || q.type}
            queueInfo={q}
            groupData={groups}
            playerData={players}
            hidePlayers={undefined}
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
              gameExpanded={gameExpanded}
            />
          ))}
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4 },
          m: { xs: '1em' },
          overflow: 'hidden',
          minWidth: 320,
          mx: 'auto',
        }}
      >
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
                  <Player
                    info={info}
                    disableSkew
                    characterType={undefined}
                    titleOld={legend[info.handle]}
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </>
  );
}

/** Default export of the StatusPage component */
export default StatusPage;
