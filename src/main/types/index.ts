/**
 * @fileoverview Type definitions for the Evos Launcher main process
 * Defines interfaces for Discord integration, user authentication, configuration, and game management.
 * Provides shared types used across the main process modules for type safety and consistency.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

/**
 * Discord Rich Presence status configuration
 * @interface DiscordStatus
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

/**
 * User authentication information
 * @interface AuthUser
 */
/**
 * Authenticated user information
 * @interface AuthUser
 */
export interface AuthUser {
  user: string;
  token: string;
  handle: string;
  banner: number;
  configFile?: string;
}

/**
 * Application configuration settings
 * @interface Config
 */
/**
 * Application configuration settings
 * @interface Config
 */
export interface Config {
  mode: string;
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorText: string;
  colorScrollBar: string;
  colorPaper: string;
  ip: string;
  authenticatedUsers: AuthUser[];
  activeUser: AuthUser | null;
  exePath: string;
  gamePort: string;
  ticketEnabled: string;
  showAllChat: string;
  enableDiscordRPC: string;
  branch: string;
  selectedArguments?: Record<string, string | null>;
}

/**
 * Manages child processes for game instances
 * @interface Games
 */
export interface Games {
  [key: string]: import('child_process').ChildProcess;
}

/**
 * Options for launching games
 * @interface LaunchOptions
 */
export interface LaunchOptions {
  ip: string;
  port: number;
  name: string;
  config?: string;
  ticket?: string;
  exePath: string;
  noLogEnabled: string;
}

/**
 * Represents a branch of the game code
 * @interface Branch
 */
export interface Branch {
  path: string;
  text: string;
  enabled: boolean;
  devOnly: boolean;
  files: {
    path: string;
    checksum: string;
  }[];
  arguments?: {
    key: string;
    value: string;
    description: string;
  }[];
}

/**
 * VDF (Valve Data Format) object representation
 * @interface VDFObject
 */
export interface VDFObject {
  [key: string]: string | VDFObject;
}
