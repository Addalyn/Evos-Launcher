/**
 * @fileoverview Main React application component for the Evos Launcher renderer process
 * Provides routing, theming, and global state management for the launcher interface.
 * Manages websocket connections, authentication state, and application layout.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import './App.css';

import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { HashRouter, Route, Routes } from 'react-router-dom';
import React, { useEffect, useState, useMemo } from 'react';
import { Status } from './lib/Evos';

import EvosStore from './lib/EvosStore';
import { trackEvent } from '@aptabase/electron/renderer';
import { useTranslation } from 'react-i18next';
import { Chart } from 'chart.js';

// Import custom types
import { PaletteMode } from './types/app.types';

// Import utilities
import { createEvosTheme } from './utils/theme.utils';
import { withElectron } from './utils/electronUtils';

// Import hooks
import useGameWebSocket from './hooks/useGameWebSocket';
import useDiscordRPC from './hooks/useDiscordRPC';

// Import route configuration
import { routeConfig, getLayout } from './config/routes.config';

/**
 * Page wrapper component that manages document title
 * @param {object} props - Component props
 * @param {string} props.title - The page title to display
 * @param {React.ReactNode} [props.children] - Optional child components to render
 * @returns {React.ReactElement | null} The page children or null
 */
function Page({
  title,
  children = null,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    document.title = title || 'Atlas Reactor';
  }, [title]);
  return children;
}

/**
 * Helper function to create a page with consistent title handling
 * @param {string} title - The page title
 * @param {React.ReactNode} content - The page content
 * @returns {React.ReactElement} The wrapped page content
 */
const createPage = (title: string, content: React.ReactNode) => {
  return <Page title="Atlas Reactor">{content}</Page>;
};

/**
 * Main application component for the Evos Launcher
 * Manages global state, routing, theming, and real-time connections
 * @returns {React.ReactElement} The main application component
 */
export default function App() {
  // Store and state management
  const evosStore = EvosStore();
  const { activeUser } = evosStore;
  const mode = evosStore.mode as PaletteMode;
  const { t, i18n } = useTranslation();
  const [gameTimer, setGameTimer] = useState<Date | undefined>(undefined);
  const [globalStatus, setGlobalStatus] = useState<Status>();

  // WebSocket connection for real-time game status
  useGameWebSocket({
    activeUser,
    setGlobalStatus,
  });

  // Discord Rich Presence integration
  useDiscordRPC({
    evosStore,
    globalStatus,
    gameTimer,
    setGameTimer,
    t,
  });

  // Analytics and initialization effects
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
    withElectron((electron) => {
      electron.ipcRenderer.startDiscord();
    });
  }, [
    i18n.language,
    evosStore.ip,
    evosStore.activeUser,
    mode,
    evosStore.exePath,
  ]);

  // Translation message handler
  useEffect(() => {
    const handleMessage = (event: any) => {
      withElectron((electron) => {
        electron.ipcRenderer.sendTranslate('translateReturn', t(event));
      });
    };

    const unsubscribe = withElectron((electron) => {
      return electron.ipcRenderer.on('translate', handleMessage);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [t]);

  // Chart.js global configuration
  Chart.defaults.color = evosStore.colorText || '#000000';

  // Theme configuration
  const theme = useMemo(
    () =>
      createEvosTheme({
        colorPrimary: evosStore.colorPrimary,
        colorSecondary: evosStore.colorSecondary,
        colorBackground: evosStore.colorBackground,
        colorPaper: evosStore.colorPaper,
        colorText: evosStore.colorText,
        colorScrollBar: evosStore.colorScrollBar,
        mode,
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

  // Loading state
  if (evosStore === null) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Box sx={{ display: 'flex' }}>
          <Routes>
            {routeConfig.map((route) => {
              const Layout = getLayout(route.layout);
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={createPage(
                    route.title,
                    <Layout>{route.element}</Layout>,
                  )}
                />
              );
            })}
          </Routes>
        </Box>
      </HashRouter>
    </ThemeProvider>
  );
}
