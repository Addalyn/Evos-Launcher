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
import {
  saveChatMessage,
  fetchChatHistory,
  updateMessageReactions,
} from '../lib/chatApi';
import { ChatMessage, ChatServerMessage } from '../types/chat.types';

interface UseChatWebSocketOptions {
  handle: string | undefined;
  enabled: boolean;
  onNewMessage?: (msg: ChatMessage) => void;
}

interface UseChatWebSocketResult {
  messages: ChatMessage[];
  sendMessage: (text: string, to: string, repliedToId?: string) => void;
  sendReaction: (messageId: string, emoji: string, to: string) => void;
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
          case 'REACTION': {
            if (!data.messageId || !data.reactions) break;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.messageId
                  ? { ...msg, reactions: data.reactions }
                  : msg,
              ),
            );
            break;
          }
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
              repliedTo: data.repliedTo,
            };

            setMessages((prev) => [...prev.slice(-499), msg]);

            // Persist to Strapi is now handled in sendMessage to prevent duplicate saves by recipients
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
    (text: string, to: string, repliedToId?: string) => {
      const { blockedPlayers } = EvosStore.getState();
      // Channels (e.g. 'general') are never in the blocked list — only block DM targets
      const isChannel = channels.includes(to);
      if (!isChannel && blockedPlayers.includes(to)) {
        // eslint-disable-next-line no-console
        console.warn('Cannot send message to blocked player:', to);
        return;
      }
      if (!text.trim() || !handle || !to) return;

      const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const msg: ChatMessage = {
        id: msgId,
        from: handle,
        to,
        text: text.trim(),
        timestamp: Date.now(),
        repliedTo: repliedToId,
      };

      // Persist to Strapi immediately from the sender side
      saveChatMessage(msg, isChannel);

      sendJsonMessage({
        type: 'CHAT',
        id: msgId,
        from: encodeURIComponent(handle),
        to,
        text: text.trim(),
        repliedTo: repliedToId,
      });
    },
    [handle, channels, sendJsonMessage],
  );

  const sendReaction = useCallback(
    (messageId: string, emoji: string, to: string) => {
      if (!handle || !messageId) return;

      // Find the message to get current reactions
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const currentReactions = { ...(message.reactions || {}) };
      const users = [...(currentReactions[emoji] || [])];
      const userIndex = users.indexOf(handle);

      if (userIndex > -1) {
        users.splice(userIndex, 1);
      } else {
        users.push(handle);
      }

      if (users.length === 0) {
        delete currentReactions[emoji];
      } else {
        currentReactions[emoji] = users;
      }

      // Optimistically update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reactions: currentReactions } : msg,
        ),
      );

      // Broadcast reaction
      sendJsonMessage({
        type: 'REACTION',
        messageId,
        reactions: currentReactions,
        to, // Target handle or channel
        from: handle,
      });

      // Update Strapi
      updateMessageReactions(messageId, currentReactions);
    },
    [handle, messages, sendJsonMessage],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    messageIdSet.current.clear();
  }, []);

  const loadMoreMessages = useCallback(
    async (conversation: string, page: number) => {
      if (!conversation || !handle) return 0;

      const isChannel = channels.includes(conversation);
      let history: ChatMessage[] = [];

      if (isChannel) {
        history = await fetchChatHistory(conversation, handle, true, page);
      } else {
        // Fetch both sides of DM
        const [sent, received] = await Promise.all([
          fetchChatHistory(conversation, handle, false, page), // messages to conversation
          fetchChatHistory(handle, conversation, false, page), // messages to me
        ]);
        history = [...sent, ...received].sort(
          (a, b) => a.timestamp - b.timestamp,
        );
      }

      if (history.length === 0) return 0;

      setMessages((prev) => {
        // Filter out existing messages from the history to avoid duplicates
        const newHistory = history.filter(
          (m) => !messageIdSet.current.has(m.id),
        );

        // Add new history IDs to the set
        newHistory.forEach((m) => messageIdSet.current.add(m.id));

        // Prepend history messages
        return [...newHistory, ...prev];
      });
      return history.length;
    },
    [handle, channels],
  );

  return {
    messages,
    sendMessage,
    sendReaction,
    readyState,
    onlineUsers,
    channels,
    clearMessages,
    loadMoreMessages,
  };
}
