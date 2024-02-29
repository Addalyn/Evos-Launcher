import React, { useEffect } from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';
import './App.css';
import {
  Box,
  colors,
  createTheme,
  CssBaseline,
  ThemeProvider,
  Toolbar,
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

const page = (title: string, content: React.ReactNode, t: any) => {
  return (
    <Page title={`Atlas Reactor: ${t(`menuOptions.${title}`)}`}>{content}</Page>
  );
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
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <StatusPage />
                  </Box>
                </>,
                t,
              )}
            />
            <Route
              path="/logs"
              element={page(
                'gameLogs',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <LogsPage />
                  </Box>
                </>,
                t,
              )}
            />
            <Route
              path="/settings"
              element={page(
                'settings',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <SettingsPage />
                  </Box>
                </>,
                t,
              )}
            />
            <Route
              path="/about"
              element={page(
                'about',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <AboutPage />
                  </Box>
                </>,
                t,
              )}
            />
            <Route
              path="/changelog"
              element={page(
                'changelog',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <ChangeLogPage />
                  </Box>
                </>,
                t,
              )}
            />
            <Route
              path="/download"
              element={page(
                'download',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <DownloadPage />
                  </Box>
                </>,
                t,
              )}
            />
            <Route
              path="/add-account"
              element={page(
                'status',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <AddAccountPage />
                  </Box>
                </>,
                t,
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
                t,
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
                t,
              )}
            />
            <Route
              path="/stats"
              element={page(
                'gstats',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <StatsPage />
                  </Box>
                </>,
                t,
              )}
            />
            <Route
              path="/playerstats"
              element={page(
                'pstats',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <PlayerStatsPage />
                  </Box>
                </>,
                t,
              )}
            />
            <Route
              path="/previousgames"
              element={page(
                'previousGames',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <PreviousGamesPage />
                  </Box>
                </>,
                t,
              )}
            />
            <Route
              path="/discord"
              element={page(
                'discord',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <DiscordPage />
                  </Box>
                </>,
                t,
              )}
            />
            <Route
              path="/replays"
              element={page(
                'replays',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <NotificationMessage />
                    <AdminMessage />
                    <Updater />
                    <ReplaysPage />
                  </Box>
                </>,
                t,
              )}
            />
          </Routes>
        </Box>
      </HashRouter>
    </ThemeProvider>
  );
}
