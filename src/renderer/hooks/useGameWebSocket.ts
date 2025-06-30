/**
 * @fileoverview WebSocket connection hook for real-time game status updates
 * Manages connection to the Evos game server for live status information
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import React, { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { Status, WS_URL } from '../lib/Evos';
import EvosStore from '../lib/EvosStore';
import { logoSmall } from '../lib/Resources';

/**
 * Hook for managing WebSocket connection to the game server
 * Handles connection, reconnection, and message processing
 * @param {object} params - Hook parameters
 * @param {any} params.activeUser - Currently active user
 * @param {(status: Status | undefined) => void} params.setGlobalStatus - Function to update global status
 * @returns {object} WebSocket connection state and methods
 */
export default function useGameWebSocket({
  activeUser,
  setGlobalStatus,
}: {
  activeUser: any;
  setGlobalStatus: (status: Status | undefined) => void;
}) {
  // Only connect if activeUser and handle are defined
  const shouldConnect = !!activeUser?.handle;
  const [wsConfig, setWsConfig] = React.useState(() => {
    if (!shouldConnect) return { url: null, options: undefined };
    return {
      url: WS_URL,
      options: {
        share: true,
        queryParams: { username: encodeURIComponent(activeUser.handle) },
        onMessage: (event: MessageEvent) => {
          const parsedMessage = JSON.parse(event.data);
          if (parsedMessage.error === undefined) {
            setGlobalStatus(parsedMessage);
          }
        },
        shouldReconnect: () => true,
      },
    };
  });

  // Update wsConfig when activeUser changes
  useEffect(() => {
    if (!activeUser?.handle) {
      setWsConfig({ url: null, options: undefined });
    } else {
      setWsConfig({
        url: WS_URL,
        options: {
          share: true,
          queryParams: { username: encodeURIComponent(activeUser.handle) },
          onMessage: (event: MessageEvent) => {
            const parsedMessage = JSON.parse(event.data);
            if (parsedMessage.error === undefined) {
              setGlobalStatus(parsedMessage);
            }
          },
          shouldReconnect: () => true,
        },
      });
    }
  }, [activeUser, setGlobalStatus]);

  const { sendJsonMessage, readyState, lastJsonMessage } = useWebSocket(
    wsConfig.url,
    wsConfig.options,
  );

  useEffect(() => {
    if (!shouldConnect) return undefined;

    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    /**
     * Handles WebSocket initialization and reconnection logic
     * Sends INIT message when connected, retries when disconnected
     */
    const handleWebSocketInit = () => {
      if (readyState === WebSocket.OPEN) {
        sendJsonMessage({
          type: 'INIT',
          username: encodeURIComponent(activeUser.handle),
        });
      } else if (readyState === WebSocket.CLOSED) {
        setGlobalStatus(undefined);
        retryTimeout = setTimeout(() => {
          handleWebSocketInit();
        }, 3000); // Retry every 3 seconds until connected
      }
    };

    handleWebSocketInit();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (shouldConnect && readyState === WebSocket.OPEN) {
        sendJsonMessage({
          type: 'DISCONNECT',
          username: encodeURIComponent(activeUser.handle),
        });
      }
    };
  }, [activeUser, readyState, sendJsonMessage, setGlobalStatus, shouldConnect]);

  const { followedPlayers } = EvosStore();
  const shownNotifications = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (lastJsonMessage && typeof lastJsonMessage === 'object') {
      const { players } = lastJsonMessage as {
        players: Array<{ handle: string; status: string }>;
      };

      if (players) {
        // Remove players from cache if they are no longer in the WebSocket message
        const currentHandles = new Set(players.map((player) => player.handle));
        shownNotifications.current.forEach((handle) => {
          if (!currentHandles.has(handle)) {
            shownNotifications.current.delete(handle);
          }
        });

        // Trigger notifications for followed players who are online and not already shown
        players.forEach((player) => {
          if (
            followedPlayers.includes(player.handle) &&
            player.status !== 'Offline' &&
            !shownNotifications.current.has(player.handle)
          ) {
            const notification = new Notification('Player Online', {
              body: `${player.handle} has logged in!`,
              silent: false,
              icon: logoSmall(),
            });
            notification.onclick = () => {
              // Handle notification click if needed
            };
            shownNotifications.current.add(player.handle);
          }
        });
      }
    }
  }, [lastJsonMessage, followedPlayers]);

  return { sendJsonMessage, readyState };
}
