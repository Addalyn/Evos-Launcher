/**
 * @fileoverview Chat context that provides a shared WebSocket chat connection
 * across all pages in the Evos Launcher, supporting private messaging.
 * @author Evos Launcher Team
 * @since 3.2.1
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { ReadyState } from 'react-use-websocket';
import EvosStore from '../../lib/EvosStore';
import useChatWebSocket, { ChatMessage } from '../../hooks/useChatWebSocket';
import { logoSmall } from '../../lib/Resources';

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (text: string, to: string) => void;
  readyState: ReadyState;
  onlineUsers: string[];
  unreadCounts: Record<string, number>;
  clearUnread: (handle: string) => void;
  totalUnreadCount: number;
  setActiveConversation: (handle: string | null) => void;
  activeConversation: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const activeUser = EvosStore((state: any) => state.activeUser);
  const hideChat = EvosStore((state: any) => state.hideChat);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null,
  );

  const { messages, sendMessage, readyState, onlineUsers } = useChatWebSocket({
    handle: activeUser?.handle,
    enabled: !!activeUser && hideChat !== 'true',
  });

  const blockedPlayers = EvosStore((state: any) => state.blockedPlayers);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const lastProcessedIdRef = useRef<string | null>(null);

  // Track unread messages per user
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // Prevent re-processing the same message when activeConversation changes
      if (lastMessage.id === lastProcessedIdRef.current) return;
      lastProcessedIdRef.current = lastMessage.id;

      // Only count if it's not from us, not system, not from a blocked player, and not the active conversation
      if (
        lastMessage.from !== activeUser?.handle &&
        lastMessage.from !== 'System' &&
        !blockedPlayers.includes(lastMessage.from) &&
        lastMessage.from !== activeConversation
      ) {
        setUnreadCounts((prev) => ({
          ...prev,
          [lastMessage.from]: (prev[lastMessage.from] || 0) + 1,
        }));

        // Trigger system notification
        if (Notification.permission === 'granted') {
          const notification = new Notification('New Chat Message', {
            body: `${lastMessage.from}: ${lastMessage.text}`,
            silent: false,
            icon: logoSmall(),
          });
          notification.onclick = () => {
            window.focus();
            // Optional: navigate to chat or set active conversation
          };
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    }
  }, [messages, activeUser?.handle, activeConversation, blockedPlayers]);

  const clearUnread = useCallback((handle: string) => {
    setUnreadCounts((prev) => {
      if (!prev[handle]) return prev;
      const next = { ...prev };
      delete next[handle];
      return next;
    });
  }, []);

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  const value = useMemo(
    () => ({
      messages,
      sendMessage,
      readyState,
      onlineUsers,
      unreadCounts,
      clearUnread,
      totalUnreadCount,
      setActiveConversation,
      activeConversation,
    }),
    [
      messages,
      sendMessage,
      readyState,
      onlineUsers,
      unreadCounts,
      clearUnread,
      totalUnreadCount,
      activeConversation,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
