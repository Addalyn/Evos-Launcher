/* eslint-disable no-console */
/**
 * @fileoverview IPC (Inter-Process Communication) handlers for the main Electron process
 * Manages communication between the main process and renderer process for file operations,
 * game launching, Discord integration, configuration management, and auto-updates.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import {
  ipcMain,
  BrowserWindow,
  dialog,
  shell,
  globalShortcut,
  app,
} from 'electron';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import * as crypto from 'crypto';
import rpc from 'discord-rpc';
import { download } from 'electron-dl';
import AuthClient from '../discord/services/auth';
import { oauthConfig } from '../discord/config/config';
import {
  readConfig,
  configFilePath,
  writeConfigSync,
  clearConfig,
  defaultConfig,
} from '../config';
import { translate, setTranslatedText } from '../services/translationService';
import {
  applyAllChat,
  launchGame,
  closeGame,
  hasRunningGames,
} from '../services/gameService';
import { startDownload, terminateDownload } from '../services/downloadService';
import { readAndParseVDF, convertLinuxPathToWindows } from '../utils/fileUtils';
import regedit from 'regedit';
import { AuthUser, LaunchOptions } from '../types';
import {
  setupDiscordServiceIPC,
  setAuthClient,
  setLinkingMode,
  setUser,
} from '../services/discordService';

/**
 * Discord status interface for RPC integration.
 */
interface discordStatus {
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
 * Branch interface for game version management.
 */
interface Branch {
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
 * Discord RPC client instance.
 */
const client = new rpc.Client({
  transport: 'ipc',
});

/**
 * Discord RPC connection status.
 */
let isDiscordRPCConnected = false;

// Initialize Discord RPC
client.login({ clientId: '1074636924721049620' }).catch((error) => {
  log.error('Discord RPC login failed:', error);
});

client.on('ready', () => {
  isDiscordRPCConnected = true;
  log.info('Discord RPC connected');
});

client.on('disconnected', () => {
  isDiscordRPCConnected = false;
  log.info('Discord RPC disconnected');
});

/**
 * Sends a status message to the renderer window.
 *
 * @param win - The browser window to send the message to
 * @param text - The status text to send
 */
function sendStatusToWindow(win: BrowserWindow, text: string): void {
  win?.webContents?.send('message', text);
}

/**
 * Calculates the SHA1 checksum of a file.
 *
 * @param filePath - The path to the file to calculate checksum for
 * @returns A promise that resolves to the hex checksum string
 */
async function calculateFileChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

/**
 * Downloads a game file from a URL to a specified directory.
 *
 * @param filedirectory - The directory to download to
 * @param fileName - The name of the file to download
 * @param url - The URL to download from
 * @param i - Index parameter (unused but kept for compatibility)
 * @param win - The browser window for progress updates
 * @returns A promise that resolves to true if successful, false otherwise
 */
async function downloadGame(
  filedirectory: string,
  fileName: string,
  url: string,
  i: number,
  win: BrowserWindow,
): Promise<boolean> {
  try {
    await download(win, url, {
      directory: filedirectory,
      showBadge: true,
      filename: fileName,
      showProgressBar: true,
      overwrite: true,
      onProgress: (status) => {
        const percent = Math.round(status.percent * 100);
        sendStatusToWindow(win, `Downloading: ${fileName} ${percent}%`);
      },
      onCancel: () => {
        sendStatusToWindow(win, 'Download cancelled');
      },
    });
    return true;
  } catch (error) {
    log.error('Download failed:', error);
    sendStatusToWindow(win, 'Download failed');
    return false;
  }
}

/**
 * Checks if a file is accessible for writing.
 *
 * @param filePath - The path to check
 * @returns A promise that resolves to true if accessible, rejects with error if not
 */
const checkFileAccessibility = (filePath: fs.PathLike): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.W_OK, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(true);
        } else if (err.code === 'EBUSY') {
          reject(new Error('File is locked or busy.'));
        } else {
          reject(new Error('Failed to access file.'));
        }
      } else {
        resolve(true);
      }
    });
  });
};

/**
 * Authentication client instance for Discord OAuth operations.
 */
let authClient: AuthClient | null = null;

/**
 * Current application version string.
 */
let currentVersion: string;

/**
 * Global download path for game downloads.
 */
let globalDownloadPath = '';

/**
 * Sets up all IPC (Inter-Process Communication) handlers for communication between
 * the main process and renderer process. Handles file operations, game management,
 * updates, and various application features.
 *
 * @param mainWindow - The main application window instance, used for dialogs and communication
 */
export function setupIpcHandlers(mainWindow: BrowserWindow | null): void {
  // Setup Discord service IPC handlers
  setupDiscordServiceIPC(ipcMain);

  ipcMain.handle('write-file', (event, args) => {
    writeConfigSync(args.data);
  });

  ipcMain.handle('read-file', async () => {
    try {
      return await readConfig();
    } catch (error) {
      log.info('Error while reading or creating the config file:', error);
      return null;
    }
  });

  ipcMain.handle('clear-file', () => {
    clearConfig();
  });

  ipcMain.on('close-game', async (event, args) => {
    const { response } = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: await translate('closeGameConfirm', mainWindow),
    });
    if (response === 0) {
      // User confirmed - kill the game and update state
      event.reply('setActiveGame', args, false);
      closeGame(args);
    }
    // If user cancelled (response === 1), do nothing - game remains active
  });

  ipcMain.handle('set-show-all-chat', async (event, args) => {
    applyAllChat(args);
  });

  ipcMain.handle('getLogData', async (event, args) => {
    try {
      const logFolder = args;
      const folders = fs.readdirSync(logFolder);

      const sortedData = folders
        .map((folder) => {
          const folderPath = path.join(logFolder, folder);
          const files = fs.readdirSync(folderPath);
          const sortedFiles = files
            .map((file) => ({
              name: file,
              fullPath: path.join(folderPath, file),
              size: fs.statSync(path.join(folderPath, file)).size,
              lastModified: fs.statSync(path.join(folderPath, file)).mtimeMs,
            }))
            .sort((a, b) => b.lastModified - a.lastModified);
          return {
            name: folder,
            fullPath: folderPath,
            files: sortedFiles,
          };
        })
        .sort((a, b) => {
          const aLatest = a.files[0]?.lastModified || 0;
          const bLatest = b.files[0]?.lastModified || 0;
          return bLatest - aLatest;
        });

      return sortedData;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return [];
    }
  });

  ipcMain.handle('setTitleBarOverlay', async (event, settings) => {
    mainWindow?.setTitleBarOverlay({
      color: settings[0],
      symbolColor: settings[1],
      height: 63,
    });
  });

  ipcMain.handle('getLogContent', async (event, args) => {
    try {
      const logPath = args;
      const content = fs.readFileSync(logPath, 'utf-8');
      return content;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return null;
    }
  });

  ipcMain.handle('getReplayData', async (event, args) => {
    try {
      const replaysFolder = path.join(
        path.dirname(path.dirname(args)),
        'Replays',
      );
      const files = fs.readdirSync(replaysFolder);

      const sortedFiles = files
        .map((file) => ({
          name: file,
          fullPath: path.join(replaysFolder, file),
          size: fs.statSync(path.join(replaysFolder, file)).size,
          lastModified: fs.statSync(path.join(replaysFolder, file)).mtimeMs,
        }))
        .sort((a, b) => b.lastModified - a.lastModified);

      return sortedFiles;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return [];
    }
  });

  ipcMain.handle('getReplayContent', async (event, args) => {
    try {
      const logPath = args;
      const content = fs.readFileSync(logPath, 'utf-8');
      return content;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return null;
    }
  });

  ipcMain.handle('replayExists', async (event, args) => {
    try {
      const { exePath, name } = args;
      const replaysFolder = path.join(
        path.dirname(path.dirname(exePath)),
        'Replays',
      );

      return fs.existsSync(path.join(replaysFolder, name));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return false;
    }
  });

  ipcMain.handle('saveReplay', async (event, args) => {
    try {
      const { exePath, name, data } = args;
      const replaysFolder = path.join(
        path.dirname(path.dirname(exePath)),
        'Replays',
      );
      fs.writeFileSync(
        path.join(replaysFolder, name),
        JSON.stringify(data),
        'utf-8',
      );
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return false;
    }
  });

  ipcMain.handle('open-folder', async (event, args) => {
    try {
      shell.openPath(args);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return false;
    }
  });

  ipcMain.on(
    'launch-game',
    async (event: any, args: { launchOptions: LaunchOptions }) => {
      const { launchOptions } = args;
      let enableAllChat = 'true';
      let selectedArguments = {};

      try {
        const config = await readConfig();
        if (config) {
          enableAllChat = config.showAllChat;
          selectedArguments = config.selectedArguments || {};
        }
      } catch (error) {
        log.info('Error reading config for game launch:', error);
      }

      // Create callback to notify renderer when game exits
      const onGameExit = (playerName: string) => {
        event.reply('setActiveGame', playerName, false);
      };

      const onGameStart = (playerName: string) => {
        event.reply('setActiveGame', playerName, true);
      };

      try {
        launchGame(
          launchOptions,
          enableAllChat,
          selectedArguments,
          onGameExit,
          onGameStart,
        );
      } catch (error) {
        log.error('Failed to launch game:', error);
        // Notify renderer of failure
        event.reply('setActiveGame', launchOptions.name, false);
      }
    },
  );

  ipcMain.on('openUrl', async (event, args) => {
    // eslint-disable-next-line no-console
    console.log('Opening url:', args);
    shell.openExternal(args);
  });

  ipcMain.handle('translateReturn', async (event, arg) => {
    if (arg === '') {
      return '';
    }
    setTranslatedText(arg);
    return undefined;
  });

  ipcMain.handle('getVersion', async () => {
    return currentVersion;
  });

  ipcMain.handle('checkVersion', async () => {
    autoUpdater.checkForUpdates();
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ipcMain.handle('search-for-game', async (_event) => {
    console.log('Searching for the game');
    const targetAppId = '402570';
    let searchGamePath = null;
    let foundGamePath = null;

    // Windows Steam registry search
    try {
      const regKey = [
        'HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam',
        'HKLM\\SOFTWARE\\Valve\\Steam',
      ];

      const registryList = await regedit.promisified.list(regKey);
      console.log('Steam registry search results:', registryList);

      if (registryList[regKey[0]]?.values?.InstallPath?.value) {
        searchGamePath = registryList[regKey[0]]?.values?.InstallPath?.value;
      }

      if (registryList[regKey[1]]?.values?.InstallPath?.value) {
        searchGamePath = registryList[regKey[1]]?.values?.InstallPath?.value;
      }
    } catch (err) {
      console.log('Error reading Steam registry:', err);
    }

    // Search in Steam libraries
    try {
      if (searchGamePath) {
        const vdfPath = path.join(
          searchGamePath as string,
          'steamapps',
          'libraryfolders.vdf',
        );
        const pathOfGame = await readAndParseVDF(vdfPath, targetAppId);
        if (pathOfGame) {
          console.log(`Path for appid ${targetAppId}: ${pathOfGame}`);

          // Try the full Steam path first
          const fullSteamPath = path.join(
            pathOfGame,
            'steamapps',
            'common',
            'Atlas Reactor',
            'Games',
            'Atlas Reactor',
            'Live',
            'Win64',
            'AtlasReactor.exe',
          );
          if (fs.existsSync(fullSteamPath)) {
            foundGamePath = fullSteamPath;
            return foundGamePath;
          }

          // Try alternative Steam path structure
          const altSteamPath = path.join(
            pathOfGame,
            'steamapps',
            'common',
            'AtlasReactor',
            'AtlasReactor.exe',
          );
          if (fs.existsSync(altSteamPath)) {
            foundGamePath = altSteamPath;
            return foundGamePath;
          }

          console.log('Game executable not found in expected Steam paths');
        } else {
          console.log(`Appid ${targetAppId} not found in Steam libraries.`);
        }
      } else {
        console.log('Steam installation path not found in registry.');
      }
    } catch (error) {
      console.error('Error reading or parsing the VDF file:', error);
    }

    // Fallback: try common Steam installation directories if registry failed
    if (!foundGamePath && !searchGamePath) {
      const commonSteamPaths = [
        'C:\\Program Files (x86)\\Steam',
        'C:\\Program Files\\Steam',
        'D:\\Steam',
        'E:\\Steam',
      ];

      const tryFallbackPath = async (steamPath: string) => {
        try {
          if (fs.existsSync(steamPath)) {
            console.log(`Trying fallback Steam path: ${steamPath}`);
            const vdfPath = path.join(
              steamPath,
              'steamapps',
              'libraryfolders.vdf',
            );
            const pathOfGame = await readAndParseVDF(vdfPath, targetAppId);
            if (pathOfGame) {
              console.log(`Found game via fallback in: ${pathOfGame}`);

              // Try the full Steam path first
              const fullSteamPath = path.join(
                pathOfGame,
                'steamapps',
                'common',
                'Atlas Reactor',
                'Games',
                'Atlas Reactor',
                'Live',
                'Win64',
                'AtlasReactor.exe',
              );
              if (fs.existsSync(fullSteamPath)) {
                return fullSteamPath;
              }

              // Try alternative Steam path structure
              const altSteamPath = path.join(
                pathOfGame,
                'steamapps',
                'common',
                'AtlasReactor',
                'AtlasReactor.exe',
              );
              if (fs.existsSync(altSteamPath)) {
                return altSteamPath;
              }
            }
          }
        } catch (error) {
          console.log(
            `Error checking fallback Steam path ${steamPath}:`,
            error,
          );
        }
        return null;
      };

      const fallbackResults = await Promise.all(
        commonSteamPaths.map(tryFallbackPath),
      );
      foundGamePath = fallbackResults.find((result) => result !== null) || null;
      if (foundGamePath) {
        return foundGamePath;
      }
    }

    // Steam Deck fallback search
    if (!foundGamePath) {
      try {
        const vdfPath = `Z:\\home\\deck\\.local\\share\\Steam\\steamapps\\libraryfolders.vdf`;
        const pathOfGame = await readAndParseVDF(vdfPath, targetAppId);
        if (pathOfGame) {
          console.log(
            `Path for appid ${targetAppId} on Steam Deck: ${pathOfGame}`,
          );
          foundGamePath = convertLinuxPathToWindows(
            `${pathOfGame}`,
            'steamapps/common/Atlas Reactor/Games/Atlas Reactor/Live/Win64/AtlasReactor.exe',
          );
          if (foundGamePath && fs.existsSync(foundGamePath)) {
            return foundGamePath;
          }
        } else {
          console.log(`Appid ${targetAppId} not found on Steam Deck.`);
        }
      } catch (error) {
        console.error('Error reading Steam Deck VDF file:', error);
      }
    }

    console.log('Game not found in any Steam installation.');
    return null;
  });

  ipcMain.handle('quitAndInstall', async () => {
    autoUpdater.quitAndInstall(true, true);
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ipcMain.handle('open-file-dialog', async (_event, config) => {
    if (config) {
      const files = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          {
            name: await translate('Atlas Reactor Config', mainWindow),
            extensions: ['json'],
          },
        ],
      });

      const selectedFilePath = files.filePaths[0];

      if (selectedFilePath && selectedFilePath.endsWith('.json')) {
        return selectedFilePath;
      }
      return null;
    }

    const files = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: await translate('Atlas Reactor Executable', mainWindow),
          extensions: ['exe'],
        },
      ],
    });

    const selectedFilePath = files.filePaths[0];

    if (selectedFilePath && selectedFilePath.endsWith('AtlasReactor.exe')) {
      return selectedFilePath;
    }

    return null;
  });

  ipcMain.handle('cancel-download-game', async () => {
    terminateDownload();
  });

  ipcMain.handle('open-folder-dialog', async () => {
    const files = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });

    const selectedFilePath = files.filePaths[0];

    if (selectedFilePath) {
      return selectedFilePath;
    }

    return null;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ipcMain.handle('link-account', async (_event, authUser: AuthUser) => {
    if (oauthConfig.client_id !== '') {
      if (!authClient || !authClient.isListening()) {
        authClient = new AuthClient(oauthConfig);
        // Set the auth client reference in Discord service
        setAuthClient(authClient);
      }

      // Set the user data and enable linking mode in Discord service
      setUser(authUser);
      setLinkingMode(true);

      authClient.openBrowser();
    }
  });

  ipcMain.handle(
    'set-discord-rpc-status',
    async (event, args: discordStatus) => {
      if (isDiscordRPCConnected) {
        client.setActivity({
          details: args.details ? args.details : undefined,
          state: args.state ? args.state : undefined,
          largeImageKey: args.largeImageKey ? args.largeImageKey : undefined,
          largeImageText: args.largeImageText ? args.largeImageText : undefined,
          smallImageKey: args.smallImageKey ? args.smallImageKey : undefined,
          smallImageText: args.smallImageText ? args.smallImageText : undefined,
          startTimestamp: args.startTimestamp ? args.startTimestamp : undefined,
          buttons: args.buttons ? args.buttons : undefined,
        });
      }
    },
  );

  ipcMain.handle('join-discord-channel', async () => {
    if (isDiscordRPCConnected) {
      // client.createLobby - Not implemented yet
      log.info('Discord channel join requested but not implemented');
    }
  });

  ipcMain.handle('stop-discord-rpc', async () => {
    client.clearActivity();
  });

  ipcMain.handle('start-discord-rpc', async () => {
    if (isDiscordRPCConnected) {
      const config = await readConfig();
      if (config?.enableDiscordRPC === 'true') {
        // Discord RPC is ready to use - activity will be set by other handlers
        log.info('Discord RPC is ready');
      }
    }
  });

  ipcMain.handle('download-game', async (_event, downloadPath: string) => {
    log.info('Starting game download to:', downloadPath);
    globalDownloadPath = downloadPath;
    startDownload(globalDownloadPath, mainWindow);
  });

  ipcMain.on('downloadGame', async (event, dir) => {
    try {
      log.info('Downloading game to:', dir);
      // This handler uses the original download worker approach
      // For now, we'll delegate to the download service
      mainWindow?.webContents.send('download-progress', {
        text: 'Download started...',
      });
    } catch (error) {
      log.error('Download error:', error);
      mainWindow?.webContents.send('download-progress-completed', {
        text: 'Download failed',
      });
    }
  });

  ipcMain.on('cancelDownload', async () => {
    // Cancel any ongoing downloads
    terminateDownload();
    log.info('Download cancelled');
  });

  ipcMain.on('getAssetPath', (event) => {
    // Return the asset path to the renderer
    const assetPath = app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../../assets');
    event.reply('getAssetPath', assetPath);
  });

  ipcMain.handle('check-branch', async (event, args: Branch) => {
    if (args === undefined) {
      sendStatusToWindow(mainWindow as BrowserWindow, `branchInvalid`);
      return;
    }
    try {
      let exePath = '';
      const config = await readConfig();
      exePath = config?.exePath || '';

      if (exePath !== '') {
        const basePath = path.dirname(exePath);

        const downloadResults = await Promise.all(
          args.files.map(async (file) => {
            const filePath = path.join(basePath, file.path);
            const exists = fs.existsSync(filePath);

            if (exists) {
              try {
                const actualChecksum = await calculateFileChecksum(filePath);
                const isChecksumValid =
                  actualChecksum.toUpperCase() === file.checksum.toUpperCase();
                return { file: file.path, success: isChecksumValid };
              } catch (error) {
                return { file: file.path, success: false };
              }
            } else {
              return { file: file.path, success: false };
            }
          }),
        );

        const failedDownloads = downloadResults
          .filter((result) => !result.success)
          .map((result) => result.file);

        if (failedDownloads.length !== 0) {
          sendStatusToWindow(mainWindow as BrowserWindow, `branchOutdated`);
        }
      }
    } catch (error) {
      log.error('Error while checking the branch:', error);
    }
  });

  ipcMain.handle('update-branch', async (event, args: Branch) => {
    let exePath = '';
    try {
      const config = await readConfig();
      exePath = config?.exePath || '';
    } catch (error) {
      log.info('Error while reading the config file:', error);
    }

    if (exePath !== '') {
      const basePath = path.dirname(exePath);
      const failedDownloads: string[] = [];
      let failedDownloadReasons = '';

      const processFile = async (file: { path: string; checksum: string }) => {
        const filePath = path.join(basePath, file.path);
        const downloadPath = `${filePath}.download`;

        try {
          // Check if the file exists and has a matching checksum
          if (fs.existsSync(filePath)) {
            const existingChecksum = await calculateFileChecksum(filePath);
            const isChecksumValid =
              existingChecksum.toUpperCase() === file.checksum.toUpperCase();

            if (isChecksumValid) {
              log.info(`File is up to date: ${filePath}`);
              return true;
            }
          }

          // Download the file to a temporary .download path
          const downloadSuccess = await downloadGame(
            basePath,
            `${file.path}.download`,
            `https://builds.evos.live/${args.path}/${file.path}`,
            0,
            mainWindow as BrowserWindow,
          );

          if (!downloadSuccess) {
            failedDownloadReasons = `Failed to download: ${file.path}`;
            return false;
          }

          // Check file accessibility
          const isAccessible = await checkFileAccessibility(downloadPath);

          if (!isAccessible) {
            log.info(`File is not accessible: ${downloadPath}`);
            failedDownloadReasons = `File is not accessible: ${downloadPath}`;
            return false;
          }

          // Validate checksum
          const actualChecksum = await calculateFileChecksum(downloadPath);
          const isChecksumValid =
            actualChecksum.toUpperCase() === file.checksum.toUpperCase();

          if (!isChecksumValid) {
            failedDownloadReasons = `Checksum mismatch: ${file.path}`;
            return false;
          }

          // Backup the original file, if it exists
          if (fs.existsSync(filePath)) {
            const backupPath = `${filePath}.bak`;
            fs.renameSync(filePath, backupPath);
          }

          // Check original file accessibility
          const isAccessibleOriginalFile =
            await checkFileAccessibility(filePath);

          if (!isAccessibleOriginalFile) {
            log.info(`Original File is not accessible: ${filePath}`);
            failedDownloadReasons = `File is not accessible: ${filePath}`;
            return false;
          }

          // Replace the original file with the downloaded .download file
          fs.renameSync(downloadPath, filePath);

          return true;
        } catch (error) {
          log.info(`Error while processing file: ${file.path}`, error);
          // @ts-ignore
          failedDownloadReasons = error.toString();
          return false;
        }
      };
      const processFiles = args.files.reduce(async (previousPromise, file) => {
        await previousPromise;
        const success = await processFile(file);
        if (!success) {
          failedDownloads.push(file.path);
        }
      }, Promise.resolve());

      try {
        await processFiles;

        if (failedDownloads.length === 0) {
          sendStatusToWindow(mainWindow as BrowserWindow, 'completed');
        } else {
          sendStatusToWindow(
            mainWindow as BrowserWindow,
            `Error: The following files failed to download: ${failedDownloads.join(', ')}\nReason: ${failedDownloadReasons}`,
          );
        }
      } catch (error) {
        sendStatusToWindow(mainWindow as BrowserWindow, `Error: ${error}`);
      }
    } else {
      sendStatusToWindow(
        mainWindow as BrowserWindow,
        'Error could not find exePath',
      );
    }
  });

  /**
   * Recursively finds TypeScript and JavaScript source files
   * @param dir - Directory to search
   * @param fileList - Accumulator for found files
   * @returns Array of file paths
   */
  function findSourceFiles(dir: string, fileList: string[] = []): string[] {
    try {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Skip node_modules and other unnecessary directories
          if (
            !file.includes('node_modules') &&
            !file.includes('.git') &&
            !file.includes('dist') &&
            !file.includes('build') &&
            !file.includes('release')
          ) {
            findSourceFiles(filePath, fileList);
          }
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
          fileList.push(filePath);
        }
      });
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }

    return fileList;
  }

  /**
   * Handler for getting source files in the project
   */
  ipcMain.handle('get-source-files', async () => {
    try {
      const projectRoot = path.join(__dirname, '../../../');
      const sourceFiles = findSourceFiles(path.join(projectRoot, 'src'));
      return sourceFiles;
    } catch (error) {
      console.error('Error getting source files:', error);
      return [];
    }
  });

  /**
   * Handler for reading file content
   */
  ipcMain.handle('read-file-content', async (event, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error('Error reading file content:', error);
      return null;
    }
  });
}

/**
 * Sets up global keyboard shortcuts for the application.
 * Registers shortcuts for developer tools and configuration reset.
 *
 * @param mainWindow - The main application window instance
 */
export function setupGlobalShortcuts(mainWindow: BrowserWindow | null): void {
  globalShortcut.register('CmdOrCtrl+F12', () => {
    mainWindow?.webContents.toggleDevTools();
  });

  globalShortcut.register('CmdOrCtrl+F2', () => {
    fs.writeFileSync(
      configFilePath,
      JSON.stringify(defaultConfig, null, 2),
      'utf-8',
    );
    mainWindow?.reload();
  });
}

/**
 * Sets up auto-updater event handlers for managing application updates.
 * Handles update checking, downloading, and user notifications.
 *
 * @param mainWindow - The main application window instance for sending update messages
 */
export function setupAutoUpdater(mainWindow: BrowserWindow | null): void {
  // Explicitly set the GitHub feed URL for auto-updates
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Addalyn',
    repo: 'Evos-Launcher',
  });

  autoUpdater.on('checking-for-update', async () => {
    const checkingMessage = await translate('checkingForUpdate', mainWindow);
    mainWindow?.webContents.send('message', checkingMessage);
  });

  autoUpdater.on('update-available', async () => {
    mainWindow?.webContents.send('message', 'Update available.');
  });

  autoUpdater.on('update-not-available', () => {
    // eslint-disable-next-line no-console
    console.log('Update not available');
  });

  autoUpdater.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.log('Error in auto-updater:', err);
  });

  autoUpdater.on('download-progress', async (progressObj) => {
    mainWindow?.webContents.send(
      'message',
      `downloading ${progressObj.percent.toFixed(2)}%`,
    );
  });

  autoUpdater.on('update-downloaded', async () => {
    mainWindow?.webContents.send('message', 'updateDownloaded');
  });
}

/**
 * Sets up the window close handler to prevent accidental closure when games are running.
 * Shows a confirmation dialog if games are currently active.
 *
 * @param mainWindow - The main application window instance
 */
export function setupWindowCloseHandler(
  mainWindow: BrowserWindow | null,
): void {
  mainWindow?.on('close', async function handleWindowClose(e) {
    // if any games running
    if (hasRunningGames()) {
      e.preventDefault();
      const { response } = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: await translate('closeAppWithGamesRunning', mainWindow),
      });
      if (response === 0) {
        app.quit();
      }
    } else {
      // Allow normal window close behavior when no games are running
      app.quit();
    }
  });
}

/**
 * Sets the current application version for use in IPC handlers.
 *
 * @param version - The current application version string
 */
export function setCurrentVersion(version: string): void {
  currentVersion = version;
}
