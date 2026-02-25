/**
 * @fileoverview Page for private messaging between users.
 * Features a sidebar of online users and a chat area for the selected conversation.
 * @author Evos Launcher Team
 * @since 3.2.1
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  InputAdornment,
  Fade,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Send as SendIcon,
  Circle as CircleIcon,
  Search as SearchIcon,
  Forum as ChatIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ReadyState } from 'react-use-websocket';
import { useChat } from '../generic/ChatContext';
import EvosStore from '../../lib/EvosStore';
import Player from '../atlas/Player';
import { getPlayerData, PlayerData } from 'renderer/lib/Evos';

export default function ChatPage() {
  const { t } = useTranslation();
  const activeUser = EvosStore((state: any) => state.activeUser);
  const {
    messages,
    sendMessage,
    readyState,
    onlineUsers,
    unreadCounts,
    clearUnread,
    setActiveConversation,
  } = useChat();

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  /** Player data retrieved from the API */
  const [playerData, setPlayerData] = useState<PlayerData>();

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  // Handle active conversation and clear unreads
  useEffect(() => {
    setActiveConversation(selectedUser);
    if (selectedUser) {
      clearUnread(selectedUser);
    }

    // Cleanup on unmount
    return () => setActiveConversation(null);
  }, [selectedUser, clearUnread, setActiveConversation]);

  useEffect(() => {
    if (selectedUser === '') {
      return;
    }

    // Fetch player data and handle response/errors
    getPlayerData(activeUser?.token ?? '', selectedUser)
      // eslint-disable-next-line promise/always-return
      .then((resp) => {
        resp.data.status = resp.data.titleId as unknown as string;
        setPlayerData(resp.data);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.log(e);
      });
  }, [selectedUser, activeUser]);

  const handleSend = () => {
    if (inputText.trim() && selectedUser) {
      sendMessage(inputText.trim(), selectedUser);
      setInputText('');
    }
  };

  const filteredUsers = onlineUsers.filter(
    (u) =>
      u !== activeUser?.handle &&
      u.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const conversationMessages = messages.filter(
    (m) =>
      m.isSystem ||
      (m.from === selectedUser && m.to === activeUser?.handle) ||
      (m.from === activeUser?.handle && m.to === selectedUser),
  );

  const getConnectionStatusColor = () => {
    switch (readyState) {
      case ReadyState.OPEN:
        return '#4caf50';
      case ReadyState.CONNECTING:
        return '#ffeb3b';
      default:
        return '#f44336';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 80px)', // Adjust based on Navbar height
        maxHeight: 'calc(100vh - 80px)',
        width: '100%',
        overflow: 'hidden',
        p: 2,
        gap: 2,
      }}
    >
      {/* Users Sidebar */}
      <Paper
        sx={{
          width: 300,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(20, 20, 30, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              mb: 2,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ChatIcon sx={{ color: '#ff7b00' }} />{' '}
            {t('chat.communityTitle', 'Community Chat')}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'white',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {t('chat.subtitle')}
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder={t('chat.searchUsers', 'Search users...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 2,
              },
            }}
          />
        </Box>

        <List sx={{ flex: 1, overflowY: 'auto', py: 0 }}>
          {filteredUsers.length === 0 ? (
            <Box
              sx={{ p: 3, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}
            >
              <Typography variant="body2">
                {t('chat.noUsersOnline', 'No others online')}
              </Typography>
            </Box>
          ) : (
            filteredUsers.map((user) => (
              <ListItem key={user} disablePadding>
                <ListItemButton
                  selected={selectedUser === user}
                  onClick={() => setSelectedUser(user)}
                  sx={{
                    py: 1.5,
                    borderLeft:
                      selectedUser === user
                        ? '4px solid #ff7b00'
                        : '4px solid transparent',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 123, 0, 0.1)',
                      '&:hover': { backgroundColor: 'rgba(255, 123, 0, 0.2)' },
                    },
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                  }}
                >
                  <ListItemText
                    primary={user}
                    primaryTypographyProps={{
                      sx: {
                        color: 'white',
                        fontWeight: unreadCounts[user] ? 'bold' : 'normal',
                      },
                    }}
                    secondary={
                      unreadCounts[user]
                        ? t('chat.newMessages', 'New messages')
                        : ''
                    }
                    secondaryTypographyProps={{
                      sx: { color: '#ff7b00', fontSize: '0.75rem' },
                    }}
                  />
                  <CircleIcon sx={{ fontSize: 10, color: '#4caf50', ml: 1 }} />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>

        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip
              title={t(
                `chat.status.${ReadyState[readyState]}`,
                ReadyState[readyState],
              )}
            >
              <CircleIcon
                sx={{ fontSize: 12, color: getConnectionStatusColor() }}
              />
            </Tooltip>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            >
              {t('chat.onlineStatus', 'Status System Connected')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Chat Area */}
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(20, 20, 30, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {!selectedUser ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.5,
            }}
          >
            <ChatIcon sx={{ fontSize: 64, mb: 2, color: '#ff7b00' }} />
            <Typography variant="h6" sx={{ color: 'white' }}>
              {t('chat.selectUser', 'Select a user to start chatting')}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Chat Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {!playerData ? (
                <Skeleton
                  variant="rectangular"
                  width={240}
                  height={52}
                  style={{ display: 'inline-block', marginLeft: '4px' }}
                />
              ) : (
                <Player
                  info={playerData}
                  disableSkew
                  characterType={undefined}
                  titleOld=""
                />
              )}
              <br />
              <Typography
                variant="subtitle2"
                sx={{ color: 'white', fontWeight: 'bold' }}
              >
                {t('chat.notsaved')}
              </Typography>
            </Box>

            {/* Chat Messages */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {conversationMessages.map((msg) => {
                const isMe = msg.from === activeUser?.handle;
                return (
                  <Fade in key={msg.id}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        width: '100%',
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1.5,
                          maxWidth: '70%',
                          borderRadius: isMe
                            ? '20px 20px 4px 20px'
                            : '20px 20px 20px 4px',
                          background: isMe
                            ? 'linear-gradient(135deg, #ff7b00, #ff4a00)'
                            : 'rgba(255,255,255,0.1)',
                          color: 'white',
                          boxShadow: isMe
                            ? '0 4px 15px rgba(255,123,0,0.3)'
                            : 'none',
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{ wordBreak: 'break-word' }}
                        >
                          {msg.text}
                        </Typography>
                      </Paper>
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 0.5,
                          px: 1,
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: '0.7rem',
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  </Fade>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            {/* Chat Input */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder={t('chat.placeholder', 'Type a message...')}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 3,
                    },
                  }}
                />
                <IconButton
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  sx={{
                    bgcolor: '#ff7b00',
                    color: 'white',
                    '&:hover': { bgcolor: '#ff4a00' },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.2)',
                    },
                    width: 56,
                    height: 56,
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
