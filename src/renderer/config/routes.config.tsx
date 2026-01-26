/**
 * @fileoverview Route configuration and layout components for the Evos Launcher
 * Defines all application routes with their associated pages and layouts
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import React, { useCallback } from 'react';

// Page imports
import AboutPage from '../components/pages/AboutPage';
import AddAccountPage from '../components/pages/AddAccountPage';
// Generic component imports
import AdminMessage from '../components/generic/AdminMessage';
import { Box } from '@mui/material';
import BranchUpdater from '../components/generic/BranchUpdater';
import ChangeLogPage from '../components/pages/ChangeLogPage';
import DevPage from '../components/pages/DevPage';
import DiscordPage from '../components/pages/DiscordPage';
import DownloadPage from '../components/pages/DownloadPage';
import EvosStore from 'renderer/lib/EvosStore';
import FollowedPlayersPage from '../components/pages/FollowedPlayersPage';
import LinkDiscord from '../components/generic/LinkDiscord';
import LoginPage from '../components/pages/LoginPage';
import LogsPage from '../components/pages/LogsPage';
import NavBar from '../components/generic/Navbar';
import NotificationMessage from '../components/generic/NotificationMessage';
import PlayerStatsPage from '../components/pages/PlayerStatsPage';
import PreviousGamesPage from '../components/pages/PreviousGamesPage';

import RegisterPage from '../components/pages/RegisterPage';
import ReplaysPage from '../components/pages/ReplaysPage';
import SettingsPage from '../components/pages/SettingsPage';
import StatsPage from '../components/pages/StatsPage';
import StatusPage from '../components/pages/StatusPage';
import VersionUpdater from '../components/generic/VersionUpdater';
import WikiPage from '../components/pages/WikiPage';
// Electron utilities
import { isElectronApp } from '../utils/electronUtils';
import QuestsPage from 'renderer/components/pages/QuestsPage';

/**
 * Standard layout wrapper for most pages
 * Includes navigation, notifications, and common UI elements
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - The page content to render
 * @returns {React.ReactElement} The wrapped page content
 */
function StandardLayout({ children }: { children: React.ReactNode }) {
  const { activeUser } = EvosStore();

  const isAuthenticated = useCallback(() => {
    return (
      activeUser !== null &&
      Object.keys(activeUser).length !== 0 &&
      activeUser.token !== ''
    );
  }, [activeUser]);

  return (
    <>
      <NavBar />
      <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
        {isAuthenticated() && <LinkDiscord />}
        <NotificationMessage />
        <AdminMessage />
        <VersionUpdater />
        <BranchUpdater />
        {children}
      </Box>
    </>
  );
}

/**
 * Centered layout for authentication pages
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - The page content to render
 * @returns {React.ReactElement} The wrapped page content
 */
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
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
          <VersionUpdater />
          {children}
        </Box>
      </Box>
    </>
  );
}

/**
 * Minimal layout for standalone pages
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - The page content to render
 * @returns {React.ReactElement} The wrapped page content
 */
function MinimalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
        {children}
      </Box>
    </>
  );
}

/**
 * Route configuration array with path, element, and layout information
 */
const allRoutes = [
  {
    path: '/',
    element: <StatusPage />,
    layout: 'standard',
    title: 'status',
  },
  {
    path: '/logs',
    element: <LogsPage />,
    layout: 'standard',
    title: 'gameLogs',
    electronOnly: true,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
    layout: 'standard',
    title: 'settings',
  },
  {
    path: '/about',
    element: <AboutPage />,
    layout: 'standard',
    title: 'about',
  },
  {
    path: '/changelog',
    element: <ChangeLogPage />,
    layout: 'standard',
    title: 'changelog',
  },
  {
    path: '/download',
    element: <DownloadPage />,
    layout: 'standard',
    title: 'download',
    electronOnly: true,
  },
  {
    path: '/add-account',
    element: <AddAccountPage />,
    layout: 'auth',
    title: 'status',
  },
  {
    path: '/login',
    element: <LoginPage />,
    layout: 'auth',
    title: 'Login',
  },
  {
    path: '/register',
    element: <RegisterPage />,
    layout: 'auth',
    title: 'Register',
  },
  {
    path: '/stats',
    element: <StatsPage />,
    layout: 'standard',
    title: 'gstats',
  },
  {
    path: '/playerstats',
    element: <PlayerStatsPage />,
    layout: 'standard',
    title: 'pstats',
  },
  {
    path: '/previousgames',
    element: <PreviousGamesPage />,
    layout: 'standard',
    title: 'previousGames',
  },
  {
    path: '/discord',
    element: <DiscordPage />,
    layout: 'standard',
    title: 'discord',
  },
  {
    path: '/replays',
    element: <ReplaysPage />,
    layout: 'standard',
    title: 'replays',
    electronOnly: true,
  },
  {
    path: '/wiki',
    element: <WikiPage />,
    layout: 'minimal',
    title: 'wiki',
  },
  {
    path: '/dev',
    element: <DevPage />,
    layout: 'minimal',
    title: 'dev',
    electronOnly: true,
  },
  {
    path: '/followed-players',
    element: <FollowedPlayersPage />, // New page for managing followed players
    layout: 'standard',
    title: 'Followed Players',
  },
  {
    path: '/quests',
    element: <QuestsPage />,
    layout: 'standard',
    title: 'quests',
  },
];

/**
 * Filter routes based on Electron availability
 */
export const routeConfig = allRoutes.filter(
  (route) => !route.electronOnly || isElectronApp(),
);

/**
 * Gets the appropriate layout component based on layout type
 * @param {string} layoutType - The type of layout to use
 * @returns {React.FC<{ children: React.ReactNode }>} The layout component
 */
export const getLayout = (layoutType: string) => {
  switch (layoutType) {
    case 'auth':
      return AuthLayout;
    case 'minimal':
      return MinimalLayout;
    case 'standard':
    default:
      return StandardLayout;
  }
};
