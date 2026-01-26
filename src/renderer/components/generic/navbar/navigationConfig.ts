/**
 * @fileoverview Navigation configuration for the Navbar component
 * Defines the navigation menu structure with proper localization and icons.
 *
 * @author Evos Launcher Team
 * @since 2.2.6
 */

import {
  Article,
  BarChart,
  Download,
  EmojiEvents,
  Forum,
  GitHub,
  History,
  Home,
  Info,
  People,
  PriceChange,
  Replay,
  Settings,
  TextSnippet,
} from '@mui/icons-material';

import type { NavigationPage } from './types';
import React from 'react';
import { electronFeatures } from 'renderer/utils/electronUtils';

/**
 * Creates the navigation pages configuration with proper localization and icons.
 * Includes developer tools when isDev is true.
 *
 * @param {Function} t - Translation function from react-i18next
 * @param {boolean} isDev - Whether the user has developer permissions
 * @returns {NavigationPage[]} Array of navigation page configurations
 */
const createNavigationPages = (
  t: (key: string, options?: any) => string,
  isDev: boolean,
): NavigationPage[] => {
  const basePages: NavigationPage[] = [
    {
      title: t('login'),
      href: '/login',
      icon: React.createElement(Home),
      authentication: false, // No authentication required for login page
      special: true,
    },
    {
      title: t('menuOptions.status'),
      href: '/',
      icon: React.createElement(Home),
      authentication: false, // No authentication required for status page
    },
    {
      title: t('menuOptions.gstats'),
      href: '/stats',
      icon: React.createElement(BarChart),
      authentication: true, // Requires authentication for game stats
    },
    {
      title: t('menuOptions.pstats'),
      href: '/playerstats',
      icon: React.createElement(BarChart),
      authentication: true, // Requires authentication for player stats
    },
    {
      title: t('menuOptions.previousGames'),
      href: '/previousgames',
      icon: React.createElement(History),
      authentication: true, // Requires authentication for previous games
    },
    {
      title: t('menuOptions.folowedPlayers'),
      href: '/followed-players',
      icon: React.createElement(People),
      authentication: true, // Requires authentication for followed players
    },
    {
      title: t('menuOptions.quests'),
      href: '/quests',
      icon: React.createElement(EmojiEvents),
      authentication: true, // Requires authentication for quests players
    },
    // Electron-only navigation items
    ...(electronFeatures.isAvailable
      ? [
          {
            title: t('menuOptions.gameLogs'),
            href: '/logs',
            icon: React.createElement(TextSnippet),
            authentication: true, // Requires authentication for game logs
          },
          {
            title: t('menuOptions.replays', 'Replays'),
            href: '/replays',
            icon: React.createElement(Replay),
            authentication: true, // Requires authentication for replays
          },
          {
            title: t('menuOptions.download'),
            href: '/download',
            icon: React.createElement(Download),
            authentication: true, // Requires authentication for downloads
          },
        ]
      : []),
    {
      title: t('menuOptions.settings'),
      href: '/settings',
      icon: React.createElement(Settings),
      authentication: false, // Requires authentication for settings
      devider: true,
    },
    {
      title: t('menuOptions.wiki'),
      href: '/wiki',
      icon: React.createElement(Article),
      authentication: false, // No authentication required for wiki
    },
    {
      title: t('menuOptions.joinDiscord'),
      href: '/discord',
      icon: React.createElement(Forum),
      authentication: false, // No authentication required for Discord
    },
    {
      title: t('menuOptions.changelog'),
      href: '/changelog',
      icon: React.createElement(GitHub),
      authentication: false, // No authentication required for changelog
    },
    {
      title: t('menuOptions.about'),
      href: '/about',
      icon: React.createElement(Info),
      authentication: false, // No authentication required for about
    },
  ];

  // Add developer tools if user has developer permissions AND app is in development mode
  if (
    isDev &&
    process.env.NODE_ENV === 'development' &&
    electronFeatures.isAvailable
  ) {
    basePages.push({
      title: 'Developer Tools',
      href: '/dev',
      icon: React.createElement(Article),
      authentication: true, // Requires authentication for developer tools
      devider: true,
    });
  }

  // Add support option as special item
  basePages.push({
    title: t('menuOptions.SupportUs'),
    href: '#support',
    icon: React.createElement(PriceChange),
    authentication: false, // No authentication required for support
    special: true,
  });

  return basePages;
};

export default createNavigationPages;
