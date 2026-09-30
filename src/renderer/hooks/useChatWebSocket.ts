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
  loadMoreMessages: (
    conversation: string,
  ) => Promise<{ count: number; hasMore: boolean }>;
  hasLoadedHistory: (conversation: string) => boolean;
  readyUsers: string[];
  sendReadyStatus: (isReady: boolean) => void;
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
  const [readyUsers, setReadyUsers] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const messageIdSet = useRef<Set<string>>(new Set());
  const pendingSentMessages = useRef<
    Array<{ text: string; to: string; repliedToId?: string; sentAt: number }>
  >([]);
  const conversationPagination = useRef<
    Record<string, { page: number; hasMore: boolean; loaded: boolean }>
  >({});

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

            const isChannel =
              data.to === 'general' ||
              (!!data.to && channels.includes(data.to));

            // Check if this message was sent by this client instance
            const decodedFrom = decodeURIComponent(data.from || '');
            const isFromMe = data.from === handle || decodedFrom === handle;
            let wasSentByMe = false;
            if (isFromMe) {
              const pendingIndex = pendingSentMessages.current.findIndex(
                (p) =>
                  p.to === data.to &&
                  p.text === data.text &&
                  Date.now() - p.sentAt < 30000,
              );
              if (pendingIndex !== -1) {
                wasSentByMe = true;
                pendingSentMessages.current.splice(pendingIndex, 1);
              } else if (pendingSentMessages.current.length > 0) {
                wasSentByMe = true;
                pendingSentMessages.current.shift();
              }
            }

            // Deduplicate by message id
            if (messageIdSet.current.has(data.id)) break;

            const msg: ChatMessage = {
              id: data.id,
              from: data.from,
              to: data.to,
              text: data.text,
              timestamp: data.timestamp ?? Date.now(),
              repliedTo: data.repliedTo,
            };

            // Deduplicate against existing messages (e.g. if already in history with legacy msg- / local- id)
            setMessages((prev) => {
              const duplicateIndex = prev.findIndex((p) => {
                if (p.id === msg.id) return true;
                const isLegacyId =
                  p.id.startsWith('msg-') || p.id.startsWith('local-');
                if (
                  isLegacyId &&
                  p.from === data.from &&
                  p.to === data.to &&
                  p.text === data.text &&
                  Math.abs(p.timestamp - (data.timestamp ?? Date.now())) < 15000
                ) {
                  return true;
                }
                return false;
              });

              if (duplicateIndex !== -1) {
                // If it already exists with a legacy ID, update it with the official server UUID
                messageIdSet.current.add(msg.id);
                messageIdSet.current.add(prev[duplicateIndex].id);
                const updated = [...prev];
                updated[duplicateIndex] = {
                  ...updated[duplicateIndex],
                  id: msg.id,
                  repliedTo:
                    data.repliedTo || updated[duplicateIndex].repliedTo,
                };
                return updated;
              }

              messageIdSet.current.add(msg.id);
              return [...prev.slice(-499), msg];
            });

            // Persist to Strapi using the official server-assigned UUID.
            // Only the sender client that initiated the message saves it to Strapi.
            if (wasSentByMe) {
              saveChatMessage(msg, isChannel);
            }

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
          case 'READY_STATUS': {
            if (data.users !== undefined) {
              setReadyUsers(data.users);
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
      const isChannel = to === 'general' || channels.includes(to);
      if (!isChannel && blockedPlayers.includes(to)) {
        // eslint-disable-next-line no-console
        console.warn('Cannot send message to blocked player:', to);
        return;
      }
      if (!text.trim() || !handle || !to) return;

      const trimmedText = text.trim();

      // Clean up any stale pending messages older than 30s
      const now = Date.now();
      pendingSentMessages.current = pendingSentMessages.current.filter(
        (p) => now - p.sentAt < 30000,
      );

      // Track that this client sent this message so we can persist to Strapi
      // using the official server-assigned UUID once the server echoes it back.
      pendingSentMessages.current.push({
        text: trimmedText,
        to,
        repliedToId,
        sentAt: now,
      });

      sendJsonMessage({
        type: 'CHAT',
        from: encodeURIComponent(handle),
        to,
        text: trimmedText,
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
    async (conversation: string) => {
      if (!conversation || !handle) return { count: 0, hasMore: false };

      const state = conversationPagination.current[conversation] || {
        page: 1,
        hasMore: true,
        loaded: false,
      };

      if (!state.hasMore) return { count: 0, hasMore: false };

      const isChannel =
        conversation === 'general' || channels.includes(conversation);
      let history: ChatMessage[] = [];

      if (isChannel) {
        history = await fetchChatHistory(
          conversation,
          handle,
          true,
          state.page,
        );
      } else {
        // Fetch both sides of DM
        const [sent, received] = await Promise.all([
          fetchChatHistory(conversation, handle, false, state.page), // messages to conversation
          fetchChatHistory(handle, conversation, false, state.page), // messages to me
        ]);
        history = [...sent, ...received].sort(
          (a, b) => a.timestamp - b.timestamp,
        );
      }

      if (history.length === 0) {
        conversationPagination.current[conversation] = {
          ...state,
          hasMore: false,
          loaded: true,
        };
        return { count: 0, hasMore: false };
      }

      setMessages((prev) => {
        // Filter out existing messages from the history to avoid duplicates
        const newHistory: ChatMessage[] = [];

        history.forEach((historyMsg) => {
          // If ID already seen, skip
          if (messageIdSet.current.has(historyMsg.id)) {
            return;
          }

          // Check if this history message matches an existing message in prev
          // (e.g. History has legacy msg- / local- id, but prev has server UUID, or vice-versa)
          const existingMatch = prev.find((p) => {
            if (p.id === historyMsg.id) return true;
            const hasLegacyId =
              historyMsg.id.startsWith('msg-') ||
              historyMsg.id.startsWith('local-') ||
              p.id.startsWith('msg-') ||
              p.id.startsWith('local-');
            return (
              hasLegacyId &&
              p.from === historyMsg.from &&
              p.to === historyMsg.to &&
              p.text === historyMsg.text &&
              Math.abs(p.timestamp - historyMsg.timestamp) < 15000
            );
          });

          if (existingMatch) {
            // Already present in state! Record both IDs so future checks skip it immediately
            messageIdSet.current.add(historyMsg.id);
            messageIdSet.current.add(existingMatch.id);
            return;
          }

          // Also check within newHistory itself to prevent duplicates within the page
          const duplicateInNew = newHistory.find(
            (n) =>
              n.id === historyMsg.id ||
              (n.from === historyMsg.from &&
                n.to === historyMsg.to &&
                n.text === historyMsg.text &&
                Math.abs(n.timestamp - historyMsg.timestamp) < 5000),
          );

          if (!duplicateInNew) {
            messageIdSet.current.add(historyMsg.id);
            newHistory.push(historyMsg);
          }
        });

        // Prepend history messages
        return [...newHistory, ...prev];
      });

      const newHasMore = history.length > 0;
      conversationPagination.current[conversation] = {
        page: state.page + 1,
        hasMore: newHasMore,
        loaded: true,
      };

      return { count: history.length, hasMore: newHasMore };
    },
    [handle, channels],
  );

  const hasLoadedHistory = useCallback((conversation: string) => {
    return conversationPagination.current[conversation]?.loaded || false;
  }, []);

  return {
    messages,
    sendMessage,
    sendReaction,
    readyState,
    onlineUsers,
    channels,
    clearMessages,
    loadMoreMessages,
    hasLoadedHistory,
    readyUsers,
    sendReadyStatus: (isReady: boolean) => {
      if (!handle) return;
      sendJsonMessage({
        type: 'READY_STATUS',
        handle: encodeURIComponent(handle),
        isReady,
      });
    },
  };
}
