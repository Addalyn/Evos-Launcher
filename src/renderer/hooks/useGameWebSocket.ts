/**
 * @fileoverview WebSocket connection hook for real-time game status updates
 * Manages connection to the Evos game server for live status information
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { Status, WS_URL } from '../lib/Evos';

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
  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
    share: true,
    queryParams: { username: encodeURIComponent(activeUser?.handle as string) },
    onMessage: (event) => {
      const parsedMessage = JSON.parse(event.data);
      if (parsedMessage.error === undefined) {
        setGlobalStatus(parsedMessage);
      }
    },
    shouldReconnect: () => true,
  });

  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    /**
     * Handles WebSocket initialization and reconnection logic
     * Sends INIT message when connected, retries when disconnected
     */
    const handleWebSocketInit = () => {
      if (readyState === WebSocket.OPEN) {
        sendJsonMessage({
          type: 'INIT',
          username: encodeURIComponent(activeUser?.handle as string),
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
      if (readyState === WebSocket.OPEN) {
        sendJsonMessage({
          type: 'DISCONNECT',
          username: encodeURIComponent(activeUser?.handle as string),
        });
      }
    };
  }, [activeUser, readyState, sendJsonMessage, setGlobalStatus]);

  return { sendJsonMessage, readyState };
}
