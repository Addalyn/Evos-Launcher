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

import { useTranslation, Trans } from 'react-i18next';
import { trackEvent } from '@aptabase/electron/renderer';

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
  const { t } = useTranslation();

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

  const handleMessage = (event: any, message: any) => {
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
                    <Toolbar />
                    <NotificationMessage />
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
                    <Toolbar />
                    <NotificationMessage />
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
                    <Toolbar />
                    <NotificationMessage />
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
                    <Toolbar />
                    <NotificationMessage />
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
                    <Toolbar />
                    <NotificationMessage />
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
                    <Toolbar />
                    <NotificationMessage />
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
                    <Toolbar />
                    <NotificationMessage />
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
                    <Toolbar />
                    <NotificationMessage />
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
                    <Toolbar />
                    <NotificationMessage />
                    <Updater />
                    <PreviousGamesPage />
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
