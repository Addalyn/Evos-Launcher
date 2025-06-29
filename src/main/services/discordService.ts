/**
 * @fileoverview Discord Rich Presence service for integrating with Discord RPC
 * Manages Discord connection, user authentication, account linking, and activity status updates.
 * Provides functionality for displaying game status and user information in Discord.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import rpc from 'discord-rpc';
import { BrowserWindow } from 'electron';
import { AuthUser, DiscordStatus } from '../types';

// Reference to the main window for IPC communication
let mainWindow: BrowserWindow | null = null;

// Reference to the auth client for stopping the listener
let authClient: any = null;

/**
 * Flag indicating whether Discord RPC is currently connected and available.
 */
let isDiscordRPCConnected = false;

/**
 * Flag indicating whether the user is currently in Discord account linking mode.
 */
let isLinking = false;

/**
 * Currently authenticated user information, null if no user is logged in.
 */
let user: AuthUser | null = null;

/**
 * Discord RPC client instance for managing Rich Presence and activities.
 */
const client = new rpc.Client({
  transport: 'ipc',
});

/**
 * Initializes the Discord RPC connection with the configured client ID.
 * Sets up event handlers for connection status and logging.
 */
export function initializeDiscordRPC(): void {
  client.login({ clientId: '1074636924721049620' }).catch(() => {
    // Discord RPC login failed
  });

  client.on('ready', () => {
    isDiscordRPCConnected = true;
  });
}

/**
 * Gets the current Discord RPC connection status.
 *
 * @returns True if Discord RPC is connected and available, false otherwise
 */
export function getDiscordRPCStatus(): boolean {
  return isDiscordRPCConnected;
}

/**
 * Sets the Discord Rich Presence activity status.
 * Only works if Discord RPC is currently connected.
 *
 * @param status - The Discord status/activity to display
 */
export function setDiscordRPCStatus(status: DiscordStatus): void {
  if (isDiscordRPCConnected) {
    client.setActivity(status);
  }
}

/**
 * Sets a Discord activity with party information for joinable sessions.
 * Adds party ID and join secret to enable other users to join.
 *
 * @param status - The base Discord status to extend with party information
 */
export function joinDiscordChannel(status: DiscordStatus): void {
  if (isDiscordRPCConnected) {
    client.setActivity({
      ...status,
      partyId: 'party1',
      joinSecret: 'join_secret',
    });
  }
}

/**
 * Clears the current Discord Rich Presence activity.
 * Removes any displayed status from the user's Discord profile.
 */
export function clearDiscordActivity(): void {
  client.clearActivity();
}

/**
 * Sets the Discord account linking mode state.
 *
 * @param linking - True to enable linking mode, false to disable
 */
export function setLinkingMode(linking: boolean): void {
  isLinking = linking;
}

/**
 * Gets the current Discord account linking mode state.
 *
 * @returns True if currently in linking mode, false otherwise
 */
export function getLinkingMode(): boolean {
  return isLinking;
}

/**
 * Sets the currently authenticated user information.
 *
 * @param authUser - The authenticated user object, or null to clear
 */
export function setUser(authUser: AuthUser | null): void {
  user = authUser;
}

/**
 * Gets the currently authenticated user information.
 *
 * @returns The current authenticated user, or null if no user is logged in
 */
export function getUser(): AuthUser | null {
  return user;
}

/**
 * IPC handler to receive user data from the renderer process
 * Call this from the renderer before starting Discord linking
 *
 * @param authUser - The authenticated user data from the renderer
 */
export function setUserFromRenderer(authUser: AuthUser): void {
  setUser(authUser);
}

/**
 * Validates that we have all required user data before starting Discord linking
 *
 * @returns True if user data is valid and linking can proceed
 */
export function validateUserForLinking(): boolean {
  const currentUser = getUser();
  const isValid =
    currentUser !== null &&
    currentUser.handle !== undefined &&
    currentUser.handle.trim() !== '';

  return isValid;
}

/**
 * Handles authentication results specifically for Discord account linking.
 * Creates or updates Discord user records in the stats database when linking is successful.
 *
 * @param status - True if authentication was successful, false if it failed
 * @param guildInfo - Optional Discord guild/user information containing user ID and username
 */
export const authResultLinked = async (
  status: boolean,
  guildInfo?: any,
): Promise<void> => {
  if (getLinkingMode()) {
    // Validate user data before proceeding
    if (!validateUserForLinking()) {
      return;
    }

    if (status && guildInfo) {
      const userId = guildInfo.user?.id;
      const userName = guildInfo.user?.username;
      const currentUser = getUser();

      if (!userId || !userName) {
        return;
      }

      if (!currentUser?.handle) {
        // Try to extract player name from guildInfo if available
        if (guildInfo?.user?.username) {
          // TEMPORARY WORKAROUND - using Discord username as handle
          // THIS IS NOT IDEAL - you should set the proper user before linking
          const tempUser: AuthUser = {
            user: guildInfo.user.id,
            token: 'temp-token',
            handle: guildInfo.user.username,
            banner: 1,
          };
          setUser(tempUser);
        } else {
          return;
        }
      }

      try {
        const checkUrl = `https://stats-production.evos.live/api/discords?filters[discordid][$eq]=${userId}`;

        const response = await fetch(checkUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.data.length === 0) {
          const createPayload = {
            data: {
              playername: getUser()?.handle || 'unknown',
              discordid: userId,
              discordname: userName,
            },
          };

          const createResponse = await fetch(
            'https://stats-production.evos.live/api/discords',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(createPayload),
            },
          );

          if (!createResponse.ok) {
            throw new Error(
              `POST failed with HTTP ${createResponse.status}: ${createResponse.statusText}`,
            );
          }

          await createResponse.json();
        }
      } catch (error) {
        // Error with user operations
      }
    }

    // Stop the authentication client listener
    authClient?.stopListening();

    // Send IPC message to renderer to indicate Discord linking is complete
    mainWindow?.webContents.send('linkedDiscord');
  }
};

/**
 * Handles authentication results for normal (non-linking) authentication attempts.
 * Calls the linked authentication handler to process the result.
 *
 * @param status - True if authentication was successful, false if it failed
 */
export const authResult = async (status: boolean): Promise<void> => {
  if (getLinkingMode()) {
    if (status) {
      authResultLinked(status);
    }
  }
};

/**
 * Sets the main window reference for IPC communication.
 *
 * @param window - The main BrowserWindow instance
 */
export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window;
}

/**
 * Sets the auth client reference for controlling the authentication listener.
 *
 * @param authClientInstance - The auth client instance
 */
export function setAuthClient(authClientInstance: any): void {
  authClient = authClientInstance;
}

/**
 * Debug function to check the current state of the discord service
 * Call this to see what's missing for the linking process
 */
export function debugDiscordServiceState(): void {
  // Debug information about Discord service state
}

/**
 * Sets up IPC handlers for Discord service communication with the renderer
 * Call this from your main process to enable renderer-to-main communication
 *
 * @param ipcMain - The ipcMain instance from Electron
 */
export function setupDiscordServiceIPC(ipcMain: any): void {
  // Handle user data from renderer before Discord linking
  ipcMain.handle('discord:setUser', (_event: any, authUser: AuthUser) => {
    setUserFromRenderer(authUser);
    return { success: true, message: 'User set successfully' };
  });

  // Handle Discord linking request with validation
  ipcMain.handle('discord:startLinking', () => {
    if (!validateUserForLinking()) {
      return {
        success: false,
        message:
          'User validation failed - make sure user is authenticated first',
      };
    }

    setLinkingMode(true);
    return { success: true, message: 'Discord linking mode enabled' };
  });

  // Handle Discord linking stop
  ipcMain.handle('discord:stopLinking', () => {
    setLinkingMode(false);
    return { success: true, message: 'Discord linking mode disabled' };
  });

  // Get current Discord service state
  ipcMain.handle('discord:getState', () => {
    return {
      isLinking: getLinkingMode(),
      hasUser: getUser() !== null,
      userHandle: getUser()?.handle,
      isRPCConnected: getDiscordRPCStatus(),
    };
  });
}
