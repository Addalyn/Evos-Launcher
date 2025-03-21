/* eslint-disable import/no-named-default */
import './App.css';

import {
  Box,
  CssBaseline,
  ThemeProvider,
  colors,
  createTheme,
} from '@mui/material';
import { HashRouter, Route, Routes } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Status, WS_URL } from './lib/Evos';

import AboutPage from './components/pages/AboutPage';
import AddAccountPage from './components/pages/AddAccountPage';
import AdminMessage from './components/generic/AdminMessage';
import ChangeLogPage from './components/pages/ChangeLogPage';
import DevPage from './components/pages/DevPage';
import DiscordPage from './components/pages/DiscordPage';
import DownloadPage from './components/pages/DownloadPage';
import EvosStore from './lib/EvosStore';
import LinkDiscord from './components/generic/LinkDiscord';
import LoginPage from './components/pages/LoginPage';
import LogsPage from './components/pages/LogsPage';
import NavBar from './components/generic/Navbar';
import NotificationMessage from './components/generic/NotificationMessage';
import PlayerStatsPage from './components/pages/PlayerStatsPage';
import { default as PlayerStatsPagev1 } from './components/pages/PlayerStatsPageV1';
import PreviousGamesPage from './components/pages/PreviousGamesPage';
import { default as PreviousGamesPagev1 } from './components/pages/PreviousGamesPageV1';
import RegisterPage from './components/pages/RegisterPage';
import ReplaysPage from './components/pages/ReplaysPage';
import SettingsPage from './components/pages/SettingsPage';
import StatsPage from './components/pages/StatsPage';
import { default as StatsPagev1 } from './components/pages/StatsPageV1';
import StatusPage from './components/pages/StatusPage';
import Updater from './components/generic/Updater';
import { convertToRealName } from './lib/Resources';
import { trackEvent } from '@aptabase/electron/renderer';
import { useTranslation } from 'react-i18next';
import useWebSocket from 'react-use-websocket';
import WikiPage from './components/pages/WikiPage';
import { Chart } from 'chart.js';

interface PageProps {
  title: string;
  children?: React.ReactNode;
}

type PaletteMode = 'light' | 'dark';

interface discordStatus {
  details?: string;
  state?: string;
  buttons?: {
    label: string;
    url: string;
  }[];
  startTimestamp?: Date;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
}

function Page(props: PageProps) {
  useEffect(() => {
    document.title = props.title || 'Atlas Reactor';
  }, [props.title]);
  return props.children;
}

const page = (title: string, content: React.ReactNode) => {
  return <Page title="Atlas Reactor">{content}</Page>;
};

export default function App() {
  const evosStore = EvosStore();
  const { activeUser } = evosStore;
  const mode = evosStore.mode as PaletteMode;
  const { t, i18n } = useTranslation();
  const [gameTimer, setGameTimer] = useState<Date | undefined>(undefined);
  const [globalStatus, setGlobalStatus] = useState<Status>();

  useEffect(() => {
    trackEvent('Language', {
      language: i18n.language,
    });
    trackEvent('Proxy', {
      proxy: evosStore.ip,
    });
    trackEvent('User', {
      userName: evosStore.activeUser?.user || 'No User',
      theme: mode,
      exePath: evosStore.exePath,
    });
    window.electron.ipcRenderer.startDiscord();
  }, [
    i18n.language,
    evosStore.ip,
    evosStore.activeUser,
    mode,
    evosStore.exePath,
  ]);
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
    // eslint-disable-next-line no-undef
    let retryTimeout: string | number | NodeJS.Timeout | undefined;

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
      clearTimeout(retryTimeout);
      if (readyState === WebSocket.OPEN) {
        sendJsonMessage({
          type: 'DISCONNECT',
          username: encodeURIComponent(activeUser?.handle as string),
        });
      }
    };
  }, [activeUser, readyState, sendJsonMessage]);

  useEffect(() => {
    if (evosStore.enableDiscordRPC === 'true') {
      const status: Status | undefined = globalStatus;
      if (status === undefined) {
        return;
      }
      const myUser = status.players.find(
        (player) => player.handle === evosStore.activeUser?.handle,
      );
      let discordStatus: discordStatus;
      if (myUser) {
        let map = null as Status['games'][0] | null;
        let currentTeam = '';
        let currentCharacter = '';
        if (myUser.status === 'In Game') {
          if (gameTimer === undefined) {
            setGameTimer(new Date());
          }
        } else {
          setGameTimer(undefined);
        }
        status.games.forEach((game) => {
          const teamA = game.teamA.find(
            (player) => player.accountId === myUser.accountId,
          );
          const teamB = game.teamB.find(
            (player) => player.accountId === myUser.accountId,
          );
          if (teamA || teamB) {
            map = game;
            currentTeam = teamA ? 'Team A' : 'Team B';
            currentCharacter = teamA
              ? teamA.characterType
              : teamB?.characterType || '';
          }
        });

        discordStatus = {
          details: `Playing as ${myUser.handle}`,
          state: `${myUser.status} ${map !== null && myUser.status === 'In Game' ? `as ${t(convertToRealName(currentCharacter.toLowerCase()) as string, { lng: 'en' })} (${map.teamAScore} - ${map.teamBScore})` : ''}`,
          buttons: [
            {
              label: 'Start playing!',
              url: 'https://evos.live/discord',
            },
          ],
          startTimestamp:
            myUser.status === 'In Game' ? gameTimer || new Date() : undefined,
          smallImageKey:
            map !== null && myUser.status === 'In Game'
              ? map.map.toLowerCase()
              : 'logo',
          smallImageText:
            map !== null && myUser.status === 'In Game'
              ? `Playing on ${t(`maps.${map.map}`, { lng: 'en' })} as ${t(convertToRealName(currentCharacter.toLowerCase()) as string, { lng: 'en' })} in ${currentTeam}`
              : '',
          largeImageKey:
            map !== null && myUser.status === 'In Game'
              ? currentCharacter.toLowerCase()
              : '',
          largeImageText:
            map !== null && myUser.status === 'In Game'
              ? `${t(convertToRealName(currentCharacter.toLowerCase()) as string, { lng: 'en' })}`
              : '',
        };
        window.electron.ipcRenderer.sendDiscordStatus(discordStatus);
      } else {
        window.electron.ipcRenderer.stopDiscord();
      }
    }
  }, [
    evosStore.activeUser,
    evosStore.enableDiscordRPC,
    gameTimer,
    globalStatus,
    t,
  ]);

  const handleMessage = (event: any) => {
    window.electron.ipcRenderer.sendTranslate('translateReturn', t(event));
  };

  window.electron.ipcRenderer.on('translate', handleMessage);
  Chart.defaults.color = evosStore.colorText || '#000000';
  const theme = React.useMemo(
    () =>
      createTheme({
        transform: {
          skewA: 'skewX(-15deg)',
          skewB: 'skewX(15deg)',
        },
        palette: {
          primary: {
            main: evosStore.colorPrimary,
          },
          secondary: {
            main: evosStore.colorSecondary,
          },
          background: {
            default: evosStore.colorBackground,
            paper: evosStore.colorPaper,
          },
          text: {
            primary: evosStore.colorText,
          },
          mode,
          // @ts-ignore
          teamA: {
            main: colors.blue[500],
            dark: colors.blue[900],
          },
          teamB: {
            main: colors.red[500],
            dark: colors.red[900],
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  width: '8px',
                },
                '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                  borderRadius: 0,
                  backgroundColor: evosStore.colorScrollBar,
                  minHeight: 24,
                  border: `0px solid ${mode === 'dark' ? '#272727' : '#1976d2'}`,
                },
                '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus':
                  {
                    backgroundColor: '#959595',
                  },
                '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active':
                  {
                    backgroundColor: '#959595',
                  },
                '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover':
                  {
                    backgroundColor: '#959595',
                  },
                '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
                  backgroundColor: '#272727',
                },
              },
            },
          },
        },
      }),
    [
      evosStore.colorPrimary,
      evosStore.colorSecondary,
      evosStore.colorBackground,
      evosStore.colorPaper,
      evosStore.colorText,
      evosStore.colorScrollBar,
      mode,
    ],
  );

  if (evosStore === null) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Box sx={{ display: 'flex' }}>
          <Routes>
            <Route
              path="/"
              element={page(
                'status',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <StatusPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/logs"
              element={page(
                'gameLogs',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <LogsPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/settings"
              element={page(
                'settings',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <SettingsPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/about"
              element={page(
                'about',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <AboutPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/changelog"
              element={page(
                'changelog',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <ChangeLogPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/download"
              element={page(
                'download',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <DownloadPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/add-account"
              element={page(
                'status',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <AddAccountPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/login"
              element={page(
                'Login',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Box
                      sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <Updater />
                      <LoginPage />
                    </Box>
                  </Box>
                </>,
              )}
            />
            <Route
              path="/register"
              element={page(
                'Register',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Box
                      sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <Updater />
                      <RegisterPage />
                    </Box>
                  </Box>
                </>,
              )}
            />
            <Route
              path="/statsv1"
              element={page(
                'gstats',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <StatsPagev1 />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/stats"
              element={page(
                'gstats',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <StatsPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/playerstats"
              element={page(
                'pstats',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <PlayerStatsPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/playerstatsv1"
              element={page(
                'pstats',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <PlayerStatsPagev1 />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/previousgames"
              element={page(
                'previousGames',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <PreviousGamesPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/previousgamesv1"
              element={page(
                'previousGames',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <PreviousGamesPagev1 />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/discord"
              element={page(
                'discord',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <DiscordPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/replays"
              element={page(
                'replays',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <LinkDiscord />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <ReplaysPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/wiki"
              element={page(
                'wiki',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <WikiPage />
                  </Box>
                </>,
              )}
            />
            <Route
              path="/dev"
              element={page(
                'dev',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <DevPage />
                  </Box>
                </>,
              )}
            />
          </Routes>
        </Box>
      </HashRouter>
    </ThemeProvider>
  );
}
