/**
 * @fileoverview Navigation configuration for the Navbar component
 * Defines the navigation menu structure with proper localization and icons.
 *
 * @author Evos Launcher Team
 * @since 2.2.6
 */

import React from 'react';
import {
  BarChart,
  History,
  Home,
  Info,
  Download,
  Settings,
  TextSnippet,
  Forum,
  GitHub,
  Article,
  PriceChange,
  Replay,
} from '@mui/icons-material';
import type { NavigationPage } from './types';
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
      title: t('menuOptions.status'),
      href: '/',
      icon: React.createElement(Home),
    },
    {
      title: t('menuOptions.gstats'),
      href: '/stats',
      icon: React.createElement(BarChart),
    },
    {
      title: t('menuOptions.pstats'),
      href: '/playerstats',
      icon: React.createElement(BarChart),
    },
    {
      title: t('menuOptions.previousGames'),
      href: '/previousgames',
      icon: React.createElement(History),
    },
    // Electron-only navigation items
    ...(electronFeatures.isAvailable
      ? [
          {
            title: t('menuOptions.gameLogs'),
            href: '/logs',
            icon: React.createElement(TextSnippet),
          },
          {
            title: t('menuOptions.replays', 'Replays'),
            href: '/replays',
            icon: React.createElement(Replay),
          },
          {
            title: t('menuOptions.download'),
            href: '/download',
            icon: React.createElement(Download),
          },
          {
            title: t('menuOptions.settings'),
            href: '/settings',
            icon: React.createElement(Settings),
            devider: true,
          },
        ]
      : []),
    {
      title: t('menuOptions.wiki'),
      href: '/wiki',
      icon: React.createElement(Article),
    },
    {
      title: t('menuOptions.joinDiscord'),
      href: '/discord',
      icon: React.createElement(Forum),
    },
    {
      title: t('menuOptions.changelog'),
      href: '/changelog',
      icon: React.createElement(GitHub),
    },
    {
      title: t('menuOptions.about'),
      href: '/about',
      icon: React.createElement(Info),
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
      devider: true,
    });
  }

  // Add support option as special item
  basePages.push({
    title: t('menuOptions.SupportUs'),
    href: '#support',
    icon: React.createElement(PriceChange),
    special: true,
  });

  return basePages;
};

export default createNavigationPages;
