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

import Login from './components/pages/Login';
import NavBar from './components/generic/Navbar';
import EvosStore from './lib/EvosStore';
import StatusPage from './components/pages/StatusPage';
import SettingsPage from './components/pages/SettingsPage';

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
  return <Page title={`Atlas Reactor: ${title}`}>{content}</Page>;
};

export default function App() {
  const evosStore = EvosStore();
  const mode = evosStore.mode as PaletteMode;

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
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Box sx={{ display: 'flex' }}>
          <Routes>
            <Route
              path="/"
              element={page(
                'Lobby status',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <StatusPage />
                  </Box>
                </>
              )}
            />
            <Route
              path="/settings"
              element={page(
                'Settings',
                <>
                  <NavBar />
                  <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                    <Toolbar />
                    <SettingsPage />
                  </Box>
                </>
              )}
            />
            <Route
              path="/login"
              element={page(
                'Login',
                <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                  <NavBar />
                  <Login />
                </Box>
              )}
            />
          </Routes>
        </Box>
      </HashRouter>
    </ThemeProvider>
  );
}
