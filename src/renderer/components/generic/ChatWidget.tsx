/**
 * @fileoverview Floating chat button widget shown on all standard-layout pages.
 * Shows an unread badge count and navigates to /chat on click.
 * @author Evos Launcher Team
 * @since 3.2.1
 */

import React, { type ReactElement } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge, Fab, Tooltip, Zoom } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useTranslation } from 'react-i18next';
import { ReadyState } from 'react-use-websocket';
import { useChat } from './ChatContext';
import EvosStore from '../../lib/EvosStore';

/**
 * Floating action button that shows unread chat message count.
 * Renders only when authenticated and not on the /chat page.
 *
 * @returns {ReactElement | null}
 */
const ChatWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnreadCount, readyState } = useChat();
  const { activeUser } = EvosStore();

  const isAuthenticated =
    activeUser !== null &&
    Object.keys(activeUser).length !== 0 &&
    activeUser.token !== '';

  const isOnChatPage = location.pathname === '/chat';

  // Only show when authenticated and not already on chat page
  if (!isAuthenticated || isOnChatPage) return null;

  const isConnected = readyState === ReadyState.OPEN;

  return (
    <Zoom in>
      <Tooltip
        title={t('chat.title', 'Community Chat')}
        placement="left"
        arrow
      >
        <Fab
          size="medium"
          onClick={() => navigate('/chat')}
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 1300,
            background: isConnected
              ? 'linear-gradient(135deg, rgba(25,118,210,0.9) 0%, rgba(66,165,245,0.9) 100%)'
              : 'rgba(50,50,60,0.85)',
            backdropFilter: 'blur(12px)',
            border: isConnected
              ? '1px solid rgba(25,118,210,0.5)'
              : '1px solid rgba(255,255,255,0.12)',
            boxShadow: isConnected
              ? '0 8px 24px rgba(25,118,210,0.4)'
              : '0 4px 16px rgba(0,0,0,0.4)',
            color: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: isConnected
                ? 'linear-gradient(135deg, rgba(25,118,210,1) 0%, rgba(66,165,245,1) 100%)'
                : 'rgba(70,70,80,0.95)',
              transform: 'scale(1.08) translateY(-2px)',
              boxShadow: isConnected
                ? '0 12px 32px rgba(25,118,210,0.5)'
                : '0 8px 24px rgba(0,0,0,0.5)',
            },
            '&:active': {
              transform: 'scale(0.96)',
            },
          }}
        >
          <Badge
            badgeContent={totalUnreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                right: 8,
                top: 8,
                border: '2px solid #0f0f1a',
                padding: '0 4px',
                fontSize: '0.65rem',
                height: '18px',
                minWidth: '18px',
                fontWeight: 700,
                animation:
                  totalUnreadCount > 0
                    ? 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite'
                    : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.8, transform: 'scale(1.15)' },
                },
              },
            }}
          >
            <ChatIcon sx={{ fontSize: '1.3rem' }} />
          </Badge>
        </Fab>
      </Tooltip>
    </Zoom>
  );
};

export default ChatWidget;
