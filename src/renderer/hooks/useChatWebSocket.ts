/**
 * @fileoverview WebSocket hook for the community chat feature.
 * Maintains a persistent, shared connection to the chat server so that
 * messages are received even while navigating between pages.
 * @author Evos Launcher Team
 * @since 3.2.1
 */

import { useState, useRef, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import EvosStore from '../lib/EvosStore';
import { CHAT_WS_URL } from '../lib/Evos';

export interface ChatMessage {
  id: string;
  from: string;
  to?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface ChatServerMessage {
  type: 'CHAT' | 'SYSTEM' | 'USER_LIST' | 'ERROR';
  from?: string;
  to?: string;
  text?: string;
  timestamp?: number;
  users?: string[];
  id?: string;
}

interface UseChatWebSocketOptions {
  handle: string | undefined;
  enabled: boolean;
}

interface UseChatWebSocketResult {
  messages: ChatMessage[];
  sendMessage: (text: string, to: string) => void;
  readyState: ReadyState;
  onlineUsers: string[];
  clearMessages: () => void;
}

/**
 * Hook for the community chat WebSocket connection.
 * Uses `share: true` so all components share one persistent connection.
 *
 * @param {UseChatWebSocketOptions} options - Handle and enabled flag
 * @returns {UseChatWebSocketResult} Chat state and methods
 */
export default function useChatWebSocket({
  handle,
  enabled,
}: UseChatWebSocketOptions): UseChatWebSocketResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messageIdSet = useRef<Set<string>>(new Set());

  const wsUrl = enabled && handle ? CHAT_WS_URL : null;

  const { sendJsonMessage, readyState } = useWebSocket(wsUrl, {
    share: true,
    shouldReconnect: () => true,
    reconnectAttempts: 99,
    reconnectInterval: 3000,
    queryParams: handle
      ? { username: encodeURIComponent(handle) }
      : { username: '' },
    onOpen: () => {
      if (handle) {
        sendJsonMessage({
          type: 'INIT',
          handle: encodeURIComponent(handle),
        });
      }
    },
    onMessage: (event: MessageEvent) => {
      try {
        const data: ChatServerMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'CHAT': {
            if (!data.id || !data.from || data.text === undefined) break;
            // Deduplicate by message id
            if (messageIdSet.current.has(data.id)) break;
            messageIdSet.current.add(data.id);
            const msg: ChatMessage = {
              id: data.id,
              from: data.from,
              to: data.to,
              text: data.text,
              timestamp: data.timestamp ?? Date.now(),
            };
            setMessages((prev) => [...prev.slice(-499), msg]);
            break;
          }
          case 'SYSTEM': {
            if (data.text === undefined) break;
            const sysId = `sys-${Date.now()}-${Math.random()}`;
            const sysMsg: ChatMessage = {
              id: sysId,
              from: 'System',
              text: data.text,
              timestamp: data.timestamp ?? Date.now(),
              isSystem: true,
            };
            setMessages((prev) => [...prev.slice(-499), sysMsg]);
            break;
          }
          case 'USER_LIST': {
            if (data.users !== undefined) {
              setOnlineUsers(data.users);
            }
            break;
          }
          default:
            break;
        }
      } catch {
        // ignore malformed messages
      }
    },
  });

  const sendMessage = useCallback(
    (text: string, to: string) => {
      const { blockedPlayers } = EvosStore.getState();
      if (blockedPlayers.includes(to)) {
        // eslint-disable-next-line no-console
        console.warn('Cannot send message to blocked player:', to);
        return;
      }
      if (!text.trim() || !handle || !to) return;
      sendJsonMessage({
        type: 'CHAT',
        from: encodeURIComponent(handle),
        to,
        text: text.trim(),
      });
    },
    [handle, sendJsonMessage],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    messageIdSet.current.clear();
  }, []);

  return { messages, sendMessage, readyState, onlineUsers, clearMessages };
}
