/**
 * @fileoverview Ready Check component for real-time game interest tracking.
 * Redesigned to match the launcher's PvP sections with Player cards.
 * Syncs with other clients via the community chat WebSocket and game status.
 * @author Evos Launcher Team
 * @since 3.3.0
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useChat } from './ChatContext';
import EvosStore from '../../lib/EvosStore';
import { logoSmall } from '../../lib/Resources';
import { withElectron } from '../../utils/electronUtils';
import useGameWebSocket from '../../hooks/useGameWebSocket';
import { PlayerData, Status } from '../../lib/Evos';
import Player from '../atlas/Player';
import { FlexBox } from './BasicComponents';

/**
 * Sticky bar that displays current game interest count and allows users to opt-in.
 * Triggers taskbar flashing and window focus when the threshold is reached.
 */
export default function ReadyCheckBar() {
  const { t } = useTranslation();
  const { readyUsers, sendReadyStatus } = useChat();
  const { activeUser, disableAllNotifications } = EvosStore();
  const [isReady, setIsReady] = useState(false);
  const wasAutoReadiedRef = useRef(false);
  const hasNotifiedRef = useRef(false);

  // Monitor game status from the "other" websocket
  const [gameStatus, setGameStatus] = useState<Status | undefined>();
  useGameWebSocket({ activeUser, setGlobalStatus: setGameStatus });

  // 1. Calculate users who are physically in a game queue
  const queuedUserHandles = useMemo(() => {
    if (!gameStatus?.queues || !gameStatus?.groups || !gameStatus?.players) {
      return [];
    }
    const queuedGroupIds = new Set(
      gameStatus.queues.flatMap((q) => q.groupIds),
    );
    const queuedAccountIds = new Set(
      gameStatus.groups
        .filter((g) => queuedGroupIds.has(g.groupId))
        .flatMap((g) => g.accountIds),
    );
    return gameStatus.players
      .filter((p) => queuedAccountIds.has(p.accountId))
      .map((p) => p.handle);
  }, [gameStatus]);

  // 2. Total interested is the union of manually ready users and queued users
  const allInterested = useMemo(() => {
    const union = new Set([...readyUsers, ...queuedUserHandles]);
    return Array.from(union);
  }, [readyUsers, queuedUserHandles]);

  const count = allInterested.length;
  const threshold = 8;
  const progress = (count / threshold) * 100;
  const isFull = count >= threshold;

  // Sync local "ready" state with the list from the server
  useEffect(() => {
    if (activeUser?.handle) {
      setIsReady(readyUsers.includes(activeUser.handle));
    }
  }, [readyUsers, activeUser?.handle]);

  // Auto-ready if the user joins a queue, and auto-unready when they leave/finish
  useEffect(() => {
    if (activeUser?.handle && gameStatus) {
      const isCurrentlyInQueue = queuedUserHandles.includes(activeUser.handle);
      const me = gameStatus.players.find((p) => p.handle === activeUser.handle);
      const isBusy = me && me.status !== 'Online' && !isCurrentlyInQueue;

      // If they join a queue, auto-ready them
      if (isCurrentlyInQueue && !isReady) {
        sendReadyStatus(true);
        wasAutoReadiedRef.current = true;
      }
      // If they leave queue AND they were auto-readied, unready them
      else if (!isCurrentlyInQueue && isReady && wasAutoReadiedRef.current) {
        sendReadyStatus(false);
        wasAutoReadiedRef.current = false;
      }
      // If they enter a match (Busy but not in queue), always unready
      else if (isBusy && isReady) {
        sendReadyStatus(false);
        wasAutoReadiedRef.current = false;
      }
    }
  }, [
    gameStatus,
    activeUser?.handle,
    isReady,
    sendReadyStatus,
    queuedUserHandles,
  ]);

  // Trigger Electron notifications when the threshold is met
  useEffect(() => {
    if (count >= threshold) {
      // Only notify if we haven't already notified for this "full" state
      if (!hasNotifiedRef.current && isReady) {
        withElectron((electron) => {
          electron.ipcRenderer.sendMessage('flash-frame', true);
          electron.ipcRenderer.sendMessage('focus-window');
        });

        // Trigger system notification
        if (
          Notification.permission === 'granted' &&
          disableAllNotifications === 'false'
        ) {
          const notification = new Notification(
            t('readyCheck.notificationTitle', 'Matchmaking Ready!'),
            {
              body: t('readyCheck.notificationBody', { count }),
              silent: false,
              icon: logoSmall(),
            },
          );
          notification.onclick = () => {
            window.focus();
            withElectron((electron) => {
              electron.ipcRenderer.sendMessage('focus-window');
            });
          };
        }

        hasNotifiedRef.current = true;
      }
    } else {
      // Reset the notification flag when count falls below threshold
      hasNotifiedRef.current = false;
    }
  }, [count, isReady, threshold, disableAllNotifications, t]);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = event.target.checked;
    setIsReady(newVal);
    sendReadyStatus(newVal);

    // Request notification permission if it hasn't been handled yet
    if (newVal && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // 3. Determine the color for the "Ready" status text
  const statusColor = useMemo(() => {
    if (!isReady) return 'rgba(255,255,255,0.3)';
    return isFull ? '#4caf50' : '#2196f3';
  }, [isReady, isFull]);

  // 4. Map handles to full PlayerData objects
  const interestedPlayers = useMemo(() => {
    return allInterested.map((handle) => {
      // Try to find the full player data in the game status
      const found = gameStatus?.players.find((p) => p.handle === handle);
      if (found) return found;

      // Fallback minimal player data
      return {
        handle,
        accountId: 0,
        bannerBg: 0,
        bannerFg: 0,
        titleId: 0,
        status: 'Online',
        isDev: false,
      } as PlayerData;
    });
  }, [allInterested, gameStatus?.players]);

  // Don't show if not authenticated or if the user is a guest
  if (!activeUser || !activeUser.handle) return null;

  return (
    <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          px: { xs: 0.5, sm: 1 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: isFull ? '#4caf50' : 'white',
              letterSpacing: 1.5,
              textShadow: '0 2px 12px rgba(0,0,0,0.3)',
              textTransform: 'uppercase',
              animation: isFull ? 'pulse 2s infinite' : 'none',
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
            }}
          >
            {t('readyCheck.title', 'Matchmaking Interest')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 900,
              color: isFull ? '#4caf50' : 'rgba(255,255,255,0.5)',
              bgcolor: 'rgba(0,0,0,0.3)',
              px: 1,
              borderRadius: 1,
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            {count} / {threshold}
          </Typography>
          {isFull && (
            <Typography
              variant="caption"
              sx={{
                bgcolor: '#4caf50',
                color: 'black',
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                fontWeight: 900,
                letterSpacing: 1,
              }}
            >
              {t('readyCheck.full', 'FULL!')}
            </Typography>
          )}
        </Box>

        <Tooltip
          title={
            isReady
              ? t('readyCheck.leaveInterest', 'Leave interest list')
              : t('readyCheck.joinInterest', 'Join interest list')
          }
          arrow
        >
          <FormControlLabel
            control={
              <Switch
                checked={isReady}
                onChange={handleToggle}
                color={isFull ? 'success' : 'primary'}
                size="small"
              />
            }
            label={
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: statusColor,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {isReady
                  ? t('readyCheck.ready', 'Ready')
                  : t('readyCheck.interested', 'Interested?')}
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Tooltip>
      </Box>

      {/* Progress Bar (Small) */}
      <LinearProgress
        variant="determinate"
        value={Math.min(progress, 100)}
        sx={{
          height: 4,
          borderRadius: 2,
          mb: 2,
          mx: 1,
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
            background: isFull
              ? 'linear-gradient(90deg, #4caf50, #81c784)'
              : 'linear-gradient(90deg, #1976d2, #64b5f6)',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
      />

      {/* Players Grid */}
      <FlexBox
        sx={{
          flexWrap: 'wrap',
          gap: 1.5,
          justifyContent: { xs: 'center', sm: 'flex-start' },
          px: { xs: 0, sm: 1 },
          py: 0.5,
          minHeight: interestedPlayers.length > 0 ? 'auto' : 0,
        }}
      >
        {interestedPlayers.map((player) => (
          <Player
            key={`interest-${player.handle}`}
            info={player}
            disableSkew={false}
            characterType={undefined}
            titleOld=""
          />
        ))}
        {interestedPlayers.length === 0 && (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.2)',
              fontStyle: 'italic',
              py: 1,
              px: 1,
            }}
          >
            {t(
              'readyCheck.emptyState',
              'No players currently interested. Use the toggle above to start!',
            )}
          </Typography>
        )}
      </FlexBox>
    </Paper>
  );
}
