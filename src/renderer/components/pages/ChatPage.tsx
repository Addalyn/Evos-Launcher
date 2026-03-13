/**
 * @fileoverview Page for community chat, supporting a #general channel and
 * private messaging between users.
 * Features a sidebar with channels + online users, and a chat area for the
 * selected conversation.
 * @author Evos Launcher Team
 * @since 3.2.1
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemButton,
  InputAdornment,
  Fade,
  Tooltip,
  Skeleton,
  Button,
  Chip,
  Popover,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Send as SendIcon,
  Circle as CircleIcon,
  Search as SearchIcon,
  Forum as ChatIcon,
  Tag as TagIcon,
  Person as PersonIcon,
  SentimentSatisfiedAlt as EmojiIcon,
  AddReaction as AddReactionIcon,
  Reply as ReplyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ReadyState } from 'react-use-websocket';
import { useChat } from '../generic/ChatContext';
import { ChatMessage } from '../../types/chat.types';
import EvosStore from '../../lib/EvosStore';
import Player from '../atlas/Player';
import { getPlayerData, PlayerData } from 'renderer/lib/Evos';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';

/** Channel names that map to server channels rather than user handles */
const CHANNEL_PREFIX = '#';

/**
 * Optimized component for individual chat user list items
 */
const ChatUserItem = memo(
  ({
    user,
    isSelected,
    onClick,
    token,
    unreadCount,
  }: {
    user: string;
    isSelected: boolean;
    onClick: (u: string) => void;
    token: string;
    unreadCount: number;
  }) => {
    const [userData, setUserData] = useState<PlayerData>();

    useEffect(() => {
      let isMounted = true;
      getPlayerData(token, user)
        // eslint-disable-next-line promise/always-return
        .then((resp) => {
          if (isMounted) {
            resp.data.status = resp.data.titleId as unknown as string;
            setUserData(resp.data);
          }
          return resp;
        })
        .catch(() => {
          // Silent catch for player data
        });
      return () => {
        isMounted = false;
      };
    }, [user, token]);

    return (
      <ListItem key={user} disablePadding>
        <ListItemButton
          selected={isSelected}
          onClick={() => onClick(user)}
          sx={{
            pt: 1,
            pb: 0.5,
            px: 0.1,
            borderLeft: isSelected
              ? '4px solid #ff7b00'
              : '4px solid transparent',
            '&.Mui-selected': {
              backgroundColor: 'rgba(255, 123, 0, 0.1)',
              '&:hover': { backgroundColor: 'rgba(255, 123, 0, 0.2)' },
            },
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
          }}
        >
          <Box sx={{ flex: 1, position: 'relative' }}>
            {!userData ? (
              <Skeleton
                variant="rectangular"
                width="100%"
                height={52}
                sx={{ borderRadius: 1, opacity: 0.1 }}
              />
            ) : (
              <Player
                info={userData}
                disableSkew
                characterType={undefined}
                titleOld=""
                onClick={() => onClick(user)}
              />
            )}
            {unreadCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  minWidth: 18,
                  height: 18,
                  bgcolor: '#ff7b00',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                  zIndex: 2,
                  px: 0.5,
                }}
              >
                {unreadCount}
              </Box>
            )}
          </Box>
        </ListItemButton>
      </ListItem>
    );
  },
);

/**
 * Sidebar entry for a channel (e.g. #general)
 */
const ChannelItem = memo(
  ({
    channel,
    isSelected,
    onClick,
    unreadCount,
  }: {
    channel: string;
    isSelected: boolean;
    onClick: (c: string) => void;
    unreadCount: number;
  }) => (
    <ListItem disablePadding>
      <ListItemButton
        selected={isSelected}
        onClick={() => onClick(channel)}
        sx={{
          py: 1,
          px: 1.5,
          borderLeft: isSelected
            ? '4px solid #ff7b00'
            : '4px solid transparent',
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 123, 0, 0.1)',
            '&:hover': { backgroundColor: 'rgba(255, 123, 0, 0.2)' },
          },
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TagIcon sx={{ fontSize: 16, color: '#ff7b00', flexShrink: 0 }} />
        <Typography
          variant="body2"
          sx={{ color: 'white', fontWeight: isSelected ? 700 : 400, flex: 1 }}
        >
          {channel}
        </Typography>
        {unreadCount > 0 && (
          <Box
            sx={{
              minWidth: 18,
              height: 18,
              bgcolor: '#ff7b00',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              px: 0.5,
            }}
          >
            {unreadCount}
          </Box>
        )}
      </ListItemButton>
    </ListItem>
  ),
);

/**
 * Optimized component for individual chat messages
 */
const ChatMessageItem = memo(
  ({
    msg,
    isMe,
    isChannel,
    activeUserHandle,
    onReply,
    onReactionClick,
    sendReaction,
    selectedUser,
    t,
    conversationMessages,
  }: {
    msg: ChatMessage;
    isMe: boolean;
    isChannel: boolean;
    activeUserHandle: string;
    onReply: (msg: ChatMessage) => void;
    onReactionClick: (
      event: React.MouseEvent<HTMLButtonElement>,
      msgId: string,
    ) => void;
    sendReaction: (msgId: string, emoji: string, to: string) => void;
    selectedUser: string;
    t: any;
    conversationMessages: ChatMessage[];
  }) => {
    // Resolve replied message if it's currently a string ID
    let resolvedReply = msg.repliedTo;
    if (typeof msg.repliedTo === 'string') {
      const found = conversationMessages.find((m) => m.id === msg.repliedTo);
      if (found) {
        resolvedReply = found;
      }
    }

    return (
      <Fade in>
        <Box
          id={`msg-${msg.id}`}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMe ? 'flex-end' : 'flex-start',
            width: '100%',
          }}
        >
          {/* Show sender name in channel view */}
          {isChannel && !isMe && (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                px: 1,
                mb: 0.25,
                fontSize: '0.7rem',
              }}
            >
              {msg.from}
            </Typography>
          )}

          <Box
            sx={{
              position: 'relative',
              maxWidth: '70%',
              '&:hover .message-actions': { opacity: 1 },
            }}
          >
            <Paper
              sx={{
                p: 1.5,
                borderRadius: isMe
                  ? '20px 20px 4px 20px'
                  : '20px 20px 20px 4px',
                background: isMe
                  ? 'linear-gradient(135deg, #ff7b00, #ff4a00)'
                  : 'rgba(255,255,255,0.1)',
                color: 'white',
                boxShadow: isMe ? '0 4px 15px rgba(255,123,0,0.3)' : 'none',
              }}
            >
              {resolvedReply && (
                <Box
                  sx={{
                    mb: 1,
                    pb: 1,
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: 0.7,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    const original = document.getElementById(
                      `msg-${typeof resolvedReply === 'string' ? resolvedReply : resolvedReply?.id}`,
                    );
                    original?.scrollIntoView({
                      behavior: 'smooth',
                    });
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 'bold',
                      color: isMe ? 'rgba(255,255,255,0.9)' : '#ff7b00',
                      fontSize: '0.65rem',
                      mb: 0.5,
                    }}
                  >
                    <ReplyIcon
                      sx={{
                        fontSize: 12,
                        verticalAlign: 'middle',
                        mr: 0.5,
                        transform: 'scaleX(-1)',
                      }}
                    />
                    {typeof resolvedReply === 'string'
                      ? 'Message'
                      : resolvedReply.from}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontStyle: 'italic',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: '0.75rem',
                    }}
                  >
                    {typeof resolvedReply === 'string'
                      ? '...'
                      : resolvedReply.text}
                  </Typography>
                </Box>
              )}
              <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                {msg.text}
              </Typography>
            </Paper>

            {/* Hover Actions */}
            {!isMe && (
              <Box
                className="message-actions"
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: isMe ? 'unset' : -40,
                  left: isMe ? -40 : 'unset',
                  display: 'flex',
                  gap: 0.5,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  zIndex: 10,
                  bgcolor: 'rgba(20, 20, 30, 0.8)',
                  borderRadius: 2,
                  p: 0.25,
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Tooltip title={t('chat.reply', 'Reply')}>
                  <IconButton
                    size="small"
                    onClick={() => onReply(msg)}
                    sx={{ color: 'white', p: 0.5 }}
                  >
                    <ReplyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('chat.addReaction', 'Add Reaction')}>
                  <IconButton
                    size="small"
                    onClick={(e) => onReactionClick(e, msg.id)}
                    sx={{ color: 'white', p: 0.5 }}
                  >
                    <AddReactionIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Reactions Display */}
          {msg.reactions && Object.entries(msg.reactions).length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mt: 0.5,
                px: 1,
              }}
            >
              {Object.entries(msg.reactions).map(([emoji, users]) => {
                const hasReacted = users.includes(activeUserHandle || '');
                return (
                  <Tooltip
                    key={emoji}
                    title={users.join(', ')}
                    arrow
                    placement="top"
                  >
                    <Chip
                      label={`${emoji} ${users.length}`}
                      size="small"
                      onClick={() => sendReaction(msg.id, emoji, selectedUser)}
                      sx={{
                        height: '24px',
                        fontSize: '0.75rem',
                        bgcolor: hasReacted
                          ? 'rgba(255,123,0,0.2)'
                          : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        border: hasReacted
                          ? '1px solid #ff7b00'
                          : '1px solid rgba(255,255,255,0.1)',
                        '&:hover': {
                          bgcolor: hasReacted
                            ? 'rgba(255,123,0,0.3)'
                            : 'rgba(255,255,255,0.1)',
                        },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          )}

          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              px: 1,
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.7rem',
            }}
          >
            {new Date(msg.timestamp).toLocaleString([], {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Box>
      </Fade>
    );
  },
);

export default function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hideChat = EvosStore((state: any) => state.hideChat);
  const activeUser = EvosStore((state: any) => state.activeUser);
  const {
    messages,
    sendMessage,
    sendReaction,
    readyState,
    onlineUsers,
    channels,
    unreadCounts,
    clearUnread,
    setActiveConversation,
    loadMoreMessages,
  } = useChat();

  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const nextPageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const blockedPlayers = EvosStore((state: any) => state.blockedPlayers);
  const addBlockedPlayer = EvosStore((state: any) => state.addBlockedPlayer);
  const removeBlockedPlayer = EvosStore(
    (state: any) => state.removeBlockedPlayer,
  );

  // selectedUser can be a channel name (e.g. 'general') or a user handle
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [reactionAnchor, setReactionAnchor] = useState<{
    el: HTMLButtonElement;
    msgId: string;
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  const handleReply = (msg: ChatMessage) => {
    setReplyingTo(msg);
  };

  const handleReactionClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    msgId: string,
  ) => {
    setReactionAnchor({ el: event.currentTarget, msgId });
  };

  const handleReactionEmojiClick = (emojiData: any) => {
    if (reactionAnchor) {
      sendReaction(reactionAnchor.msgId, emojiData.emoji, selectedUser);
      setReactionAnchor(null);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  const handleEmojiToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setAnchorEl(null);
  };

  const openEmoji = Boolean(anchorEl);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Redirect if chat is hidden
  useEffect(() => {
    if (hideChat === 'true') {
      navigate('/');
    }
  }, [hideChat, navigate]);

  // Auto-select the first channel (general) when channels arrive
  useEffect(() => {
    if (channels.length > 0 && selectedUser === '') {
      setSelectedUser(channels[0]);
    }
  }, [channels, selectedUser]);

  // Track which conversations have already had their history fetched
  const historyLoadedRef = useRef<Set<string>>(new Set());

  // Load history when a conversation is first opened
  useEffect(() => {
    if (!selectedUser || !activeUser?.handle) return;
    if (historyLoadedRef.current.has(selectedUser)) return;

    const fetchHistory = async () => {
      try {
        const count = await loadMoreMessages(selectedUser, 1);
        if (count > 0) {
          historyLoadedRef.current.add(selectedUser);
        }
      } catch {
        // silent fail to allow retries if loadMoreMessages changes
      }
    };

    fetchHistory();
  }, [selectedUser, loadMoreMessages, activeUser?.handle]);

  // Reset pagination when conversation changes
  useEffect(() => {
    nextPageRef.current = 1;
    setHasMoreHistory(true);
    setIsLoadingHistory(false);
  }, [selectedUser]);

  // Infinite scroll observer
  useEffect(() => {
    if (!selectedUser || !hasMoreHistory || isLoadingHistory) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const loadMore = async () => {
            setIsLoadingHistory(true);
            try {
              const count = await loadMoreMessages(
                selectedUser,
                nextPageRef.current + 1,
              );
              if (count > 0) {
                nextPageRef.current += 1;
              } else {
                setHasMoreHistory(false);
              }
            } catch (err) {
              // console.error('Failed to load more messages:', err);
            } finally {
              setIsLoadingHistory(false);
            }
          };
          loadMore();
        }
      },
      { threshold: 1.0 },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    // eslint-disable-next-line consistent-return
    return () => {
      observer.disconnect();
    };
  }, [selectedUser, hasMoreHistory, isLoadingHistory, loadMoreMessages]);

  /** Player data retrieved from the API (only for DM conversations) */
  const [playerData, setPlayerData] = useState<PlayerData>();

  // Auto-scroll to bottom of chat only for NEW messages, not when loading history
  const [prevMsgCount, setPrevMsgCount] = useState(0);
  const initialScrollDoneRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (messages.length > prevMsgCount) {
      const lastMsg = messages[messages.length - 1];
      const isMe = lastMsg?.from === activeUser?.handle;

      // Handle initial load scroll: if messages increased from 0 to something
      // and we haven't done the initial scroll for this user yet
      if (
        prevMsgCount === 0 &&
        messages.length > 0 &&
        !initialScrollDoneRef.current[selectedUser]
      ) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        initialScrollDoneRef.current[selectedUser] = true;
      }
      // Normal message scroll: if we added only 1 message or it's from us
      else if (messages.length - prevMsgCount === 1 || isMe) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setPrevMsgCount(messages.length);
  }, [messages, selectedUser, activeUser?.handle, prevMsgCount]);

  // Reset scroll tracker when conversation changes
  useEffect(() => {
    setPrevMsgCount(0);
  }, [selectedUser]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (selectedUser) {
      // Small timeout to ensure messages are rendered before scrolling
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timeoutId);
    }
    return () => {}; // Always return a cleanup function (even if empty) to satisfy consistent-return
  }, [selectedUser]);

  // Handle active conversation and clear unreads
  useEffect(() => {
    setActiveConversation(selectedUser);
    if (selectedUser) {
      clearUnread(selectedUser);
    }

    // Cleanup on unmount
    return () => setActiveConversation(null);
  }, [selectedUser, clearUnread, setActiveConversation]);

  // Fetch player data only for DM conversations, not channels
  const isChannel = channels.includes(selectedUser);

  useEffect(() => {
    if (selectedUser === '' || isChannel) {
      setPlayerData(undefined);
      return;
    }

    const fetchPlayerData = async () => {
      try {
        const resp = await getPlayerData(activeUser?.token ?? '', selectedUser);
        resp.data.status = resp.data.titleId as unknown as string;
        setPlayerData(resp.data);
      } catch {
        // Silent catch for player data
      }
    };

    fetchPlayerData();
  }, [selectedUser, activeUser, isChannel]);

  const handleSend = () => {
    if (inputText.trim() && selectedUser) {
      sendMessage(inputText.trim(), selectedUser, replyingTo?.id);
      setInputText('');
      setReplyingTo(null);
    }
  };

  const filteredUsers = onlineUsers.filter(
    (u) =>
      u !== activeUser?.handle &&
      u.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /**
   * Messages for the current conversation:
   * - Channel: all messages where msg.to === channelName
   * - DM: messages between me and the selected user (existing logic)
   */
  const conversationMessages = messages.filter((m) => {
    if (m.isSystem) return false;
    if (blockedPlayers.includes(m.from)) return false;

    if (isChannel) {
      return m.to === selectedUser;
    }

    // DM: between me and selectedUser
    return (
      (m.from === selectedUser && m.to === activeUser?.handle) ||
      (m.from === activeUser?.handle && m.to === selectedUser)
    );
  });

  // Compute input placeholder without nested ternaries
  let inputPlaceholder: string;
  if (!isChannel && blockedPlayers.includes(selectedUser)) {
    inputPlaceholder = t('chat.blockedUser', 'You have blocked this user');
  } else if (isChannel) {
    inputPlaceholder = t('chat.channelPlaceholder', 'Message #{{channel}}', {
      channel: selectedUser,
    });
  } else {
    inputPlaceholder = t('chat.placeholder', 'Type a message...');
  }

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
        height: 'calc(100vh - 80px)',
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
          width: 265,
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
            variant="subtitle1"
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
            {t('chat.communityTitle', 'Community Chat')} <br />(
            {onlineUsers.length} {t('chat.online', 'Online')})
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'white',
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 0,
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
          {/* Channels section */}
          {channels.length > 0 && (
            <>
              <Box
                sx={{
                  px: 1.5,
                  pt: 1.5,
                  pb: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t('chat.channels', 'Channels')}
                </Typography>
              </Box>
              {channels.map((ch) => (
                <ChannelItem
                  key={ch}
                  channel={ch}
                  isSelected={selectedUser === ch}
                  onClick={setSelectedUser}
                  unreadCount={unreadCounts[ch] || 0}
                />
              ))}
              <Box
                sx={{
                  px: 1.5,
                  pt: 1.5,
                  pb: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                  mt: 0.5,
                }}
              >
                <PersonIcon
                  sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t('chat.directMessages', 'Direct Messages')}
                </Typography>
              </Box>
            </>
          )}

          {/* Online users (DMs) */}
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
              <ChatUserItem
                key={user}
                user={user}
                isSelected={selectedUser === user}
                onClick={setSelectedUser}
                token={activeUser?.token ?? ''}
                unreadCount={unreadCounts[user] || 0}
              />
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
              {isChannel ? (
                /* Channel header */
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #ff7b00, #ff4a00)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <TagIcon sx={{ color: 'white', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}
                    >
                      {CHANNEL_PREFIX}
                      {selectedUser}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      {t(
                        'chat.generalDescription',
                        'Public channel — visible to everyone online',
                      )}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={t('chat.channelLabel', 'Channel')}
                    sx={{
                      ml: 1,
                      bgcolor: 'rgba(255,123,0,0.15)',
                      color: '#ff7b00',
                      border: '1px solid rgba(255,123,0,0.3)',
                      height: 20,
                      fontSize: '0.65rem',
                    }}
                  />
                </Box>
              ) : (
                /* DM header — same as before */
                <>
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
                    sx={{
                      color: 'white',
                      fontWeight: 'bold',
                      flex: 1,
                      fontSize: 12,
                    }}
                  >
                    {t('chat.warning')}
                  </Typography>
                  {selectedUser && selectedUser !== activeUser?.handle && (
                    <Button
                      variant="outlined"
                      color={
                        blockedPlayers.includes(selectedUser)
                          ? 'error'
                          : 'warning'
                      }
                      onClick={() => {
                        if (blockedPlayers.includes(selectedUser)) {
                          removeBlockedPlayer(selectedUser);
                        } else {
                          addBlockedPlayer(selectedUser);
                        }
                      }}
                      sx={{ ml: 'auto' }}
                    >
                      {blockedPlayers.includes(selectedUser)
                        ? t('menuOptions.Unblock')
                        : t('menuOptions.Block')}
                    </Button>
                  )}
                </>
              )}
            </Box>

            {/* Chat Messages */}
            <Box
              ref={scrollRef}
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                /* Custom scrollbar styling to ensure visibility */
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 123, 0, 0.3)',
                  borderRadius: '10px',
                  '&:hover': {
                    background: 'rgba(255, 123, 0, 0.5)',
                  },
                },
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 123, 0, 0.3) rgba(0,0,0,0.1)',
              }}
            >
              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} style={{ height: '1px' }} />

              {isLoadingHistory && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} sx={{ color: '#ff7b00' }} />
                </Box>
              )}

              {conversationMessages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  msg={msg}
                  isMe={msg.from === activeUser?.handle}
                  isChannel={isChannel}
                  activeUserHandle={activeUser?.handle || ''}
                  onReply={handleReply}
                  onReactionClick={handleReactionClick}
                  sendReaction={sendReaction}
                  selectedUser={selectedUser}
                  t={t}
                  conversationMessages={conversationMessages}
                />
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Chat Input Area */}
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0,0,0,0.2)',
                position: 'relative',
              }}
            >
              {replyingTo && (
                <Fade in>
                  <Box
                    sx={{
                      p: 1.5,
                      px: 2,
                      bgcolor: 'rgba(255, 123, 0, 0.1)',
                      borderLeft: '4px solid #ff7b00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography
                        variant="caption"
                        sx={{ color: '#ff7b00', fontWeight: 'bold' }}
                      >
                        Replying to {replyingTo.from}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.6)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.75rem',
                        }}
                      >
                        {replyingTo.text}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => setReplyingTo(null)}
                      sx={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Fade>
              )}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <IconButton
                  onClick={handleEmojiToggle}
                  disabled={!isChannel && blockedPlayers.includes(selectedUser)}
                  sx={{
                    color: '#ff7b00',
                    '&:hover': { bgcolor: 'rgba(255,123,0,0.1)' },
                    width: 56,
                    height: 56,
                  }}
                >
                  <EmojiIcon />
                </IconButton>
                <Popover
                  open={openEmoji}
                  anchorEl={anchorEl}
                  onClose={handleEmojiClose}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  PaperProps={{
                    sx: {
                      bgcolor: 'transparent',
                      boxShadow: 'none',
                      border: 'none',
                    },
                  }}
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    autoFocusSearch={false}
                    theme={Theme.DARK}
                    emojiStyle={EmojiStyle.NATIVE}
                    lazyLoadEmojis
                  />
                </Popover>

                <Popover
                  open={Boolean(reactionAnchor)}
                  anchorEl={reactionAnchor?.el}
                  onClose={() => setReactionAnchor(null)}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  PaperProps={{
                    sx: {
                      bgcolor: 'transparent',
                      boxShadow: 'none',
                      border: 'none',
                    },
                  }}
                >
                  <EmojiPicker
                    onEmojiClick={handleReactionEmojiClick}
                    autoFocusSearch={false}
                    theme={Theme.DARK}
                    emojiStyle={EmojiStyle.NATIVE}
                    reactionsDefaultOpen
                    allowExpandReactions
                    lazyLoadEmojis
                  />
                </Popover>

                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  disabled={!isChannel && blockedPlayers.includes(selectedUser)}
                  placeholder={inputPlaceholder}
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
                  disabled={
                    !inputText.trim() ||
                    (!isChannel && blockedPlayers.includes(selectedUser))
                  }
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
