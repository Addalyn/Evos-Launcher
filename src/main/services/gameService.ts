/**
 * @fileoverview Game service for managing Atlas Reactor game processes and configurations
 * Handles game launching, process management, registry modifications, and game lifecycle events.
 * Provides functions for chat settings, game termination, and process monitoring.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { app, BrowserWindow } from 'electron';
import regedit from 'regedit';
import { Games, LaunchOptions } from '../types';
import { trackEvent } from '@aptabase/electron/main';
import log from 'electron-log';

/**
 * Registry of currently running game processes, indexed by player username.
 */
const games: Games = {};

/**
 * Sends a game state update to all renderer windows.
 *
 * @param playerName - The username of the player
 * @param isActive - Whether the game is active or not
 */
function notifyRenderersGameStateChange(
  playerName: string,
  isActive: boolean,
): void {
  // Send to all renderer windows
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach((window) => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('setActiveGame', playerName, isActive);
    }
  });
}

/**
 * Creates a folder if it doesn't already exist.
 *
 * @param folderPath - The path to the folder to create
 */
function createFolderIfNotExists(folderPath: string): void {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      // eslint-disable-next-line no-console
      console.log(`Created folder: ${folderPath}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to create folder ${folderPath}:`, error);
  }
}

/**
 * Applies or disables the "All Chat" feature in Atlas Reactor by modifying Windows registry.
 * This setting only works on Windows and may not take effect on the first game launch.
 *
 * @param enabled - String value indicating if all chat should be enabled ('true') or disabled
 */
export function applyAllChat(enabled: string | undefined): void {
  const enableAllChat = enabled === 'true' ? 1 : 0;

  // Try Enabling All Chat based on config, will not work for the first time they launch the game, but works for any other times, and only on windows
  try {
    const valuesToPut = {
      'HKCU\\Software\\Trion Worlds\\Atlas Reactor': {
        OptionsShowAllChat_h3656758089: {
          value: enableAllChat,
          type: 'REG_DWORD' as const,
        },
      },
    };

    regedit.createKey(
      ['HKCU\\Software\\Trion Worlds\\Atlas Reactor'],
      (err) => {
        if (!err) {
          regedit.putValue(valuesToPut, (putErr) => {
            if (putErr) {
              // eslint-disable-next-line no-console
              console.error('Error setting all chat registry value:', putErr);
            } else {
              // eslint-disable-next-line no-console
              console.log('All chat registry value set successfully');
            }
          });
        } else {
          // eslint-disable-next-line no-console
          console.error('Error creating registry key:', err);
        }
      },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error in applyAllChat:', err);
  }
}

/**
 * Launches the Atlas Reactor game with the specified configuration.
 * Applies all chat settings, tracks the launch event, and spawns the game process.
 *
 * @param launchOptions - Configuration options for launching the game
 * @param enableAllChat - Whether to enable all chat functionality
 * @param selectedArguments - Additional command line arguments to pass to the game
 * @param onGameExit - Optional callback function called when the game process exits
 * @param onGameStart - Optional callback function called when the game process starts successfully
 * @returns The spawned ChildProcess instance for the game
 */
export function launchGame(
  launchOptions: LaunchOptions,
  enableAllChat: string,
  selectedArguments: Record<string, string | null>,
  onGameExit?: (playerName: string) => void,
  onGameStart?: (playerName: string) => void,
): ChildProcess {
  applyAllChat(enableAllChat);
  trackEvent('Game Launched');

  // Validate executable exists
  if (!fs.existsSync(launchOptions.exePath)) {
    const error = new Error(
      `Game executable not found: ${launchOptions.exePath}`,
    );
    // eslint-disable-next-line no-console
    console.error('Launch failed:', error.message);
    throw error;
  }

  // eslint-disable-next-line no-console
  console.log('Launching game with options:', {
    exePath: launchOptions.exePath,
    ip: launchOptions.ip,
    port: launchOptions.port,
    name: launchOptions.name,
    hasTicket: !!launchOptions.ticket,
    hasConfig: !!launchOptions.config,
    noLogEnabled: launchOptions.noLogEnabled,
    selectedArguments,
  });

  let args: string[];

  if (launchOptions.ticket) {
    // Write ticket to temporary file like in original implementation
    const { ticket } = launchOptions;
    const tempPath = app.getPath('temp');
    const authTicketPath = path.join(tempPath, 'authTicket.xml');

    try {
      fs.writeFileSync(authTicketPath, ticket, 'utf-8');
      args = [
        '-s',
        `${launchOptions.ip}:${launchOptions.port}`,
        '-t',
        authTicketPath,
      ];
      if (
        launchOptions.noLogEnabled !== undefined &&
        launchOptions.noLogEnabled !== 'false'
      ) {
        args.push('-nolog');
      }

      Object.entries(selectedArguments).forEach(([key, value]) => {
        const formattedValue = value !== null ? `=${value}` : '';
        args.push('-o');
        args.push(`${key}${formattedValue}`);
      });
    } catch (e) {
      log.info('Failed to write ticket file', e);
      throw new Error(`Failed to write auth ticket: ${e}`);
    }
  } else {
    args = ['-s', `${launchOptions.ip}:${launchOptions.port}`];
    if (
      launchOptions.noLogEnabled !== undefined &&
      launchOptions.noLogEnabled !== 'false'
    ) {
      args.push('-nolog');
    }
    if (launchOptions.config !== undefined && launchOptions.config !== '') {
      args.push('-c', launchOptions.config);
    }

    Object.entries(selectedArguments).forEach(([key, value]) => {
      const formattedValue = value !== null ? `=${value}` : '';
      args.push('-o');
      args.push(`${key}${formattedValue}`);
    });
  }

  // eslint-disable-next-line no-console
  console.log('Game launch command:', launchOptions.exePath, args);

  // Make sure we create a Log folder if it doesn't exist
  const logFolderPath = path.join(
    path.dirname(path.dirname(launchOptions.exePath)),
    'Logs',
  );
  createFolderIfNotExists(logFolderPath);

  const gameProcess = spawn(launchOptions.exePath, args, {
    cwd: path.dirname(launchOptions.exePath),
  });

  // Log process start
  // eslint-disable-next-line no-console
  console.log(`Game process started with PID: ${gameProcess.pid}`);

  games[launchOptions.name] = gameProcess;

  // Notify that game has started (like in original implementation)
  if (onGameStart) {
    onGameStart(launchOptions.name);
  }

  // Set up process exit listeners
  gameProcess.on('close', () => {
    // eslint-disable-next-line no-console
    console.log(`Game process for ${launchOptions.name} closed`);

    // Remove from active games registry
    delete games[launchOptions.name];

    // Notify all renderer windows that game has closed
    notifyRenderersGameStateChange(launchOptions.name, false);

    // Also call the exit callback if provided (for backward compatibility)
    if (onGameExit) {
      onGameExit(launchOptions.name);
    }
  });

  gameProcess.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error(
      `Game process for ${launchOptions.name} encountered an error:`,
      err,
    );

    // Remove from active games registry
    delete games[launchOptions.name];

    // Notify all renderer windows that game has closed due to error
    notifyRenderersGameStateChange(launchOptions.name, false);

    // Also call the exit callback if provided (for backward compatibility)
    if (onGameExit) {
      onGameExit(launchOptions.name);
    }
  });

  return gameProcess;
}

/**
 * Terminates a running game process by player name.
 * Removes the game from the active games registry.
 *
 * @param gameName - The username/name of the player whose game should be closed
 * @param onGameExit - Optional callback function called when the game process is terminated
 * @returns True if the game was found and terminated, false if no game was running for that player
 */
export function closeGame(
  gameName: string,
  onGameExit?: (playerName: string) => void,
): boolean {
  if (games[gameName]) {
    games[gameName].kill();
    delete games[gameName];

    // Call the exit callback if provided
    if (onGameExit) {
      onGameExit(gameName);
    }

    return true;
  }
  return false;
}

/**
 * Gets a reference to all currently running game processes.
 *
 * @returns An object containing all active game processes, indexed by player username
 */
export function getRunningGames(): Games {
  return games;
}

/**
 * Checks if there are any currently running game processes.
 *
 * @returns True if at least one game is running, false if no games are active
 */
export function hasRunningGames(): boolean {
  return Object.keys(games).length > 0;
}
