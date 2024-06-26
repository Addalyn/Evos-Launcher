import React, { useEffect, useState } from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';
import './App.css';
import {
  Box,
  colors,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';

import { useTranslation } from 'react-i18next';
import { trackEvent } from '@aptabase/electron/renderer';
import NavBar from './components/generic/Navbar';
import EvosStore from './lib/EvosStore';
import StatusPage from './components/pages/StatusPage';
import SettingsPage from './components/pages/SettingsPage';
import AboutPage from './components/pages/AboutPage';
import ChangeLogPage from './components/pages/ChangeLogPage';
import AddAccountPage from './components/pages/AddAccountPage';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import DownloadPage from './components/pages/DownloadPage';
import Updater from './components/generic/Updater';
import StatsPage from './components/pages/StatsPage';
import PreviousGamesPage from './components/pages/PreviousGamesPage';
import PlayerStatsPage from './components/pages/PlayerStatsPage';
import NotificationMessage from './components/generic/NotificationMessage';
import LogsPage from './components/pages/LogsPage';

import DiscordPage from './components/pages/DiscordPage';
import ReplaysPage from './components/pages/ReplaysPage';
import AdminMessage from './components/generic/AdminMessage';
import DevPage from './components/pages/DevPage';
import LinkDiscord from './components/generic/LinkDiscord';
import { Status, getStatus } from './lib/Evos';
import { convertToRealName } from './lib/Resources';

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
  const mode = evosStore.mode as PaletteMode;
  const { t, i18n } = useTranslation();
  const [gameTimer, setGameTimer] = useState<Date | undefined>(undefined);

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

  useEffect(() => {
    // eslint-disable-next-line no-undef
    let interval: NodeJS.Timeout | undefined;
    if (evosStore.enableDiscordRPC === 'true') {
      interval = setInterval(() => {
        getStatus()
          .then((response) => {
            const status: Status = response.data;
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
                  myUser.status === 'In Game'
                    ? gameTimer || new Date()
                    : undefined,
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
            } else {
              discordStatus = {
                details: 'Idling in Launcher',
                state: 'Waiting to start playing',
                largeImageKey: 'logo',
                // startTimestamp: discordTimestamp,
                buttons: [
                  {
                    label: 'Start playing!',
                    url: 'https://evos.live/discord',
                  },
                ],
              };
            }

            window.electron.ipcRenderer.sendDiscordStatus(discordStatus);

            return null;
          })
          .catch(() => {});
      }, 1000 * 20);
    } else if (interval !== undefined) {
      window.electron.ipcRenderer.stopDiscord();
      clearInterval(interval);
    }

    return () => {
      if (interval !== undefined) {
        clearInterval(interval);
      }
    };
  }, [evosStore.activeUser, evosStore.enableDiscordRPC, gameTimer, t]);

  const handleMessage = (event: any) => {
    window.electron.ipcRenderer.sendTranslate('translateReturn', t(event));
  };

  window.electron.ipcRenderer.on('translate', handleMessage);

  const theme = React.useMemo(
    () =>
      createTheme({
        transform: {
          skewA: 'skewX(-15deg)',
          skewB: 'skewX(15deg)',
        },
        palette: {
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
                  backgroundColor: mode === 'dark' ? '#6b6b6b' : '#1976d2',
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
    [mode],
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
