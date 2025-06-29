/**
 * @fileoverview Type definitions for the main App component
 * Contains interfaces and types used throughout the application
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import React from 'react';

/**
 * Props interface for page components
 * @interface PageProps
 * @property {string} title - The page title to display
 * @property {React.ReactNode} [children] - Optional child components to render
 */
export interface PageProps {
  title: string;
  children?: React.ReactNode;
}

/**
 * Material-UI theme palette mode
 * @typedef {'light' | 'dark'} PaletteMode
 */
export type PaletteMode = 'light' | 'dark';

/**
 * Discord Rich Presence status configuration
 * @interface DiscordStatus
 * @property {string} [details] - Primary activity description
 * @property {string} [state] - Secondary activity description
 * @property {DiscordButton[]} [buttons] - Array of clickable buttons
 * @property {Date} [startTimestamp] - When the activity started
 * @property {string} [largeImageKey] - Key for the large image asset
 * @property {string} [largeImageText] - Tooltip text for the large image
 * @property {string} [smallImageKey] - Key for the small image asset
 * @property {string} [smallImageText] - Tooltip text for the small image
 */
export interface DiscordStatus {
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
