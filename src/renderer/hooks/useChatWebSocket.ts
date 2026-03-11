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
import { saveChatMessage, fetchChatHistory } from '../lib/chatApi';

export interface ChatMessage {
  id: string;
  from: string;
  to?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface ChatServerMessage {
  type: 'CHAT' | 'SYSTEM' | 'USER_LIST' | 'ERROR' | 'CHANNEL_JOIN';
  from?: string;
  to?: string;
  text?: string;
  timestamp?: number;
  users?: string[];
  channels?: string[];
  id?: string;
}

interface UseChatWebSocketOptions {
  handle: string | undefined;
  enabled: boolean;
  onNewMessage?: (msg: ChatMessage) => void;
}

interface UseChatWebSocketResult {
  messages: ChatMessage[];
  sendMessage: (text: string, to: string) => void;
  readyState: ReadyState;
  onlineUsers: string[];
  channels: string[];
  clearMessages: () => void;
  loadMoreMessages: (conversation: string, page: number) => Promise<number>;
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
  onNewMessage,
}: UseChatWebSocketOptions): UseChatWebSocketResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
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
            
            // Persist to Strapi
            const isChannel = !!data.to && channels.includes(data.to);
            saveChatMessage(msg, isChannel);
            onNewMessage?.(msg);
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
          case 'CHANNEL_JOIN': {
            if (data.channels !== undefined) {
              setChannels(data.channels);
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
      // Channels (e.g. 'general') are never in the blocked list — only block DM targets
      const isChannel = channels.includes(to);
      if (!isChannel && blockedPlayers.includes(to)) {
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

      // Persist our own message to Strapi immediately (since server might not eco back to us depending on implementation)
      // Note: If server does eco back, the messageIdSet will prevent duplicates.
      const pseudoId = `local-${Date.now()}-${Math.random()}`;
      const msg: ChatMessage = {
        id: pseudoId,
        from: handle,
        to,
        text: text.trim(),
        timestamp: Date.now(),
      };
      saveChatMessage(msg, isChannel);
    },
    [handle, channels, sendJsonMessage],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    messageIdSet.current.clear();
  }, []);

  const loadMoreMessages = useCallback(
    async (conversation: string, page: number) => {
      if (!conversation) return 0;

      const history = await fetchChatHistory(conversation, page);
      if (history.length === 0) return 0;

      setMessages((prev) => {
        // Filter out existing messages from the history to avoid duplicates
        const newHistory = history.filter((m) => !messageIdSet.current.has(m.id));

        // Add new history IDs to the set
        newHistory.forEach((m) => messageIdSet.current.add(m.id));

        // Prepend history messages
        return [...newHistory, ...prev];
      });
      return history.length;
    },
    [],
  );

  return { messages, sendMessage, readyState, onlineUsers, channels, clearMessages, loadMoreMessages };
}
