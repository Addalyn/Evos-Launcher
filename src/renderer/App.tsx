import './App.css';

import {
  Box,
  CssBaseline,
  ThemeProvider,
  colors,
  createTheme,
} from '@mui/material';
import { HashRouter, Route, Routes } from 'react-router-dom';
import React, { useEffect } from 'react';

import AboutPage from './components/pages/AboutPage';
import AddAccountPage from './components/pages/AddAccountPage';
import AdminMessage from './components/generic/AdminMessage';
import ChangeLogPage from './components/pages/ChangeLogPage';
import DiscordPage from './components/pages/DiscordPage';
import EvosStore from './lib/EvosStore';
import LinkDiscord from './components/generic/LinkDiscord';
import LoginPage from './components/pages/LoginPage';
import LogsPage from './components/pages/LogsPage';
import NavBar from './components/generic/Navbar';
import NotificationMessage from './components/generic/NotificationMessage';
import PlayerStatsPage from './components/pages/PlayerStatsPage';
import PreviousGamesPage from './components/pages/PreviousGamesPage';
import RegisterPage from './components/pages/RegisterPage';
import SettingsPage from './components/pages/SettingsPage';
import StatsPage from './components/pages/StatsPage';
import StatusPage from './components/pages/StatusPage';
import Updater from './components/generic/Updater';
import { trackEvent } from '@aptabase/electron/renderer';
import { useTranslation } from 'react-i18next';

interface PageProps {
  title: string;
  children?: React.ReactNode;
}

type PaletteMode = 'light' | 'dark';

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
  }, [
    i18n.language,
    evosStore.ip,
    evosStore.activeUser,
    mode,
    evosStore.exePath,
  ]);

  const handleMessage = (event: any) => {
    window.electron?.ipcRenderer?.sendTranslate('translateReturn', t(event));
  };

  window.electron?.ipcRenderer?.on('translate', handleMessage);

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
          </Routes>
        </Box>
      </HashRouter>
    </ThemeProvider>
  );
}
