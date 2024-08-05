/* eslint-disable import/order */
/* eslint-disable promise/no-nesting */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable func-names */
/* eslint-disable import/no-cycle */
/* eslint-disable import/prefer-default-export */
/* eslint global-require: off, no-console: off, promise/always-return: off */
import {
  BrowserWindow,
  DownloadItem,
  IpcMainEvent,
  app,
  dialog,
  globalShortcut,
  ipcMain,
  shell,
} from 'electron';
import { ChildProcess, spawn } from 'child_process';
import electronDl, { download } from 'electron-dl';
import { initialize, trackEvent } from '@aptabase/electron/main';

import AuthClient from './discord/services/auth';
import { Worker as NativeWorker } from 'worker_threads';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import log from 'electron-log';
import { oauthConfig } from './discord/config/config';
import path from 'path';
import regedit from 'regedit';
import { resolveHtmlPath } from './util';
import rpc from 'discord-rpc';
import * as crypto from 'crypto';

const client = new rpc.Client({
  transport: 'ipc',
});
client.login({ clientId: '1074636924721049620' }).catch(console.error);

let isDiscordRPCConnected = false;
client.on('ready', () => {
  isDiscordRPCConnected = true;
  console.log('Discord RPC connected');
});

initialize('A-SH-9629286137', {
  host: 'https://launcher.evos.live',
});

const vbsDirectory = path.join(
  path.dirname(app.getPath('exe')),
  './resources/assets/vbs',
);
regedit.setExternalVBSLocation(vbsDirectory);

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

interface AuthUser {
  user: string;
  token: string;
  handle: string;
  banner: number;
  configFile?: string;
}

interface Config {
  mode: string;
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

const defaultConfig: Config = {
  mode: 'dark',
  ip: '',
  authenticatedUsers: [],
  activeUser: null,
  exePath: '',
  gamePort: '6050',
  ticketEnabled: 'true',
  showAllChat: 'true',
  enableDiscordRPC: 'true',
  branch: 'Vanilla',
  selectedArguments: {},
};

let translatedText: string;
interface Games {
  [key: string]: ChildProcess;
}

const games: Games = {};

interface LaunchOptions {
  ip: string;
  port: number;
  name: string;
  config?: string;
  ticket?: string;
  exePath: string;
  noLogEnabled: string;
}

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

let mainWindow: BrowserWindow | null = null;
let authClient: AuthClient | null = null;
log.transports.file.level = 'info';

const configFilePath = path.join(app.getPath('userData'), 'config.json');
let globalDownloadPath = '';
let currentVersion: string;

interface VDFObject {
  [key: string]: string | VDFObject;
}

async function calculateFileChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

const checkFileAccessibility = (filePath: fs.PathLike) => {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.W_OK, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(false);
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

async function readConfig() {
  try {
    const config = await fs.promises.readFile(configFilePath, 'utf-8');
    return JSON.parse(config) as Config;
  } catch (error) {
    log.info('Error while reading the config file:', error);
    return null;
  }
}

async function parseVDF(
  vdfString: string,
  targetAppId: string,
): Promise<string | undefined> {
  const lines = vdfString.split('\n');
  const stack: VDFObject[] = [];
  const result: VDFObject = {};
  let pathForAppId: string | undefined;
  let currentPath: string | undefined;

  lines.forEach((line) => {
    const matches = line.match(/"(.+?)"\s+"(.+?)"/);
    if (matches) {
      const key = matches[1];
      const value = matches[2];

      if (key === 'path') {
        currentPath = value;
      }

      if (stack.length === 0) {
        result[key] = value;
      } else {
        const currentObject = stack[stack.length - 1];
        currentObject[key] = value;
      }

      if (key === targetAppId) {
        pathForAppId = currentPath;
      }
    } else if (line.trim() === '{') {
      const newObject: VDFObject = {};
      if (stack.length === 0) {
        result.apps = newObject;
      } else {
        const currentObject = stack[stack.length - 1];
        currentObject.apps = newObject;
      }
      stack.push(newObject);
    } else if (line.trim() === '}') {
      stack.pop();
      if (stack.length === 0) {
        currentPath = undefined; // Reset path when exiting the top-level object
      }
    }
  });

  return pathForAppId;
}

async function readAndParseVDF(filePath: string, targetAppId: string) {
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return parseVDF(data, targetAppId);
  } catch (error) {
    console.error(
      `Error reading or parsing the VDF file at ${filePath}:`,
      error,
    );
    return null;
  }
}

const createFolderIfNotExists = (folderPath: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Created folder: ${folderPath}`);
  }
};

function convertLinuxPathToWindows(linuxPath: string, relativePath: string) {
  const pathParts = relativePath.split('/');
  const winPath = path.join('Z:', ...[linuxPath, ...pathParts]);
  return winPath;
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

let worker: NativeWorker | null = null;

function sendStatusToWindow(win: BrowserWindow, text: string) {
  win?.webContents?.send('message', text);
}

function translate(key: string): Promise<string> {
  translatedText = ''; // Clear the translatedText before asking for a new translation
  mainWindow?.webContents.send('translate', key);

  return new Promise((resolve) => {
    const checkTranslation = () => {
      if (translatedText !== '') {
        resolve(translatedText);
      } else {
        setTimeout(checkTranslation, 500); // Wait for 500 milliseconds before checking again
      }
    };

    checkTranslation();
  });
}

async function startDownload(downloadPath: string) {
  worker = new NativeWorker(
    path.join(
      __dirname,
      !app.isPackaged ? 'download/' : '',
      'downloadWorker.js',
    ),
    {
      workerData: {
        downloadPath,
        globalDownloadFile: 'https://media.evos.live/getfileurls.json',
        skipNewPath: false,
      },
    },
  );

  worker.on('message', async (message) => {
    switch (message.type) {
      case 'progress':
        mainWindow?.webContents.send('download-progress', message.data);
        break;
      case 'result':
        if (message.data) {
          trackEvent('Game Downloaded');
          const completeMessage = await translate('downloadComplete');
          mainWindow?.webContents.send('download-progress-completed', {
            text: completeMessage,
          });
        } else {
          const errorMessage = await translate('errorDownloading');
          mainWindow?.webContents.send('download-progress-completed', {
            text: errorMessage,
          });
        }
        break;
      case 'error':
        if (message.data) {
          mainWindow?.webContents.send('download-progress-completed', {
            text: message.data,
          });
        } else {
          const errorMessage = await translate('errorDownloading');
          mainWindow?.webContents.send('download-progress-completed', {
            text: errorMessage,
          });
        }
        break;
      default:
        break;
    }
  });

  worker.on('error', (error) => {
    log.info('Worker thread error:', error);
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      log.info('Worker thread exited with code:', code);
    }
  });
}

let isLinking = false;
let user: AuthUser | null = null;

export const setAuthResult = async (status: boolean) => {
  if (!isLinking) {
    if (status) {
      startDownload(globalDownloadPath);
    } else {
      const noDiscordAuth = await translate('noDiscordAuth');
      mainWindow?.webContents.send('download-progress-completed', {
        text: noDiscordAuth,
      });
    }

    authClient?.stopListening();
  }
};

export const setAuthResultLinked = async (status: boolean, guildInfo: any) => {
  if (isLinking) {
    if (status) {
      const userId = guildInfo.user.id;
      const userName = guildInfo.user.username;
      fetch(
        `https://stats-production.evos.live/api/discords?filters[discordid][$eq]=${userId}`,
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.data.length === 0) {
            fetch('https://stats-production.evos.live/api/discords', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                data: {
                  playername: user?.handle!,
                  discordid: userId,
                  discordname: userName,
                },
              }),
            })
              .then((response) => response.json())
              .then((data1) => {
                console.log('User created');
              })
              .catch((error) => {
                console.error('Error creating user');
              });
          } else {
            console.log('User found');
          }
        })
        .catch((error) => {
          console.error('Error fetching user');
        });
    }

    authClient?.stopListening();

    mainWindow?.webContents.send('linkedDiscord');
  }
};

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(log.info);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1250,
    height: 800,
    minWidth: 800,
    minHeight: 400,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#272727',
      symbolColor: '#74b1be',
      height: 63,
    },
    icon: getAssetPath('logo.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  const splash = new BrowserWindow({
    width: 600,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    icon: getAssetPath('logo.png'),
  });

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

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  splash.loadURL(getAssetPath('splash.html'));
  splash.center();

  async function createConfigFile() {
    let existingConfig;

    try {
      // Try to read the existing config file
      const configFileContent = await fs.promises.readFile(
        configFilePath,
        'utf-8',
      );
      existingConfig = JSON.parse(configFileContent);
    } catch (error) {
      log.info('Config file does not exist or is invalid, creating it...');
      await fs.promises.writeFile(
        configFilePath,
        JSON.stringify(defaultConfig, null, 2),
        'utf-8',
      );
      return;
    }

    // Check for missing properties in the existing config
    const updatedConfig = { ...defaultConfig, ...existingConfig };

    await fs.promises.writeFile(
      configFilePath,
      JSON.stringify(updatedConfig, null, 2),
      'utf-8',
    );
  }

  createConfigFile();

  ipcMain.handle('write-file', (event, args) => {
    fs.writeFileSync(
      configFilePath,
      JSON.stringify(args.data, null, 2),
      'utf-8',
    );
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
    fs.writeFileSync(
      configFilePath,
      JSON.stringify(defaultConfig, null, 2),
      'utf-8',
    );
  });

  ipcMain.on('close-game', async (event, args) => {
    const { response } = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: await translate('closeGameConfirm'),
    });
    if (response === 0) {
      event.reply('setActiveGame', [args, false]);
      games[args].kill();
      delete games[args];
    }
  });

  const applyAllChat = (enabled: string | undefined) => {
    const enableAllChat = enabled === 'true' ? 1 : 0;

    // Try Enabling All Chat based on config, will not work for the first time they launch the game, but works for any other times, and only on windows
    try {
      const valuesToPut = {
        'HKCU\\Software\\Trion Worlds\\Atlas Reactor': {
          OptionsShowAllChat_h3656758089: {
            value: enableAllChat,
            type: 'REG_DWORD',
          },
        },
      };

      regedit.createKey(
        // @ts-ignore
        'HKCU\\Software\\Trion Worlds\\Atlas Reactor',
        // @ts-ignore
        function (a, b) {
          // @ts-ignore
          regedit.putValue(valuesToPut, (err) => {
            if (err) {
              console.log('[ERROR] Problem writing to registry.', err);
            } else {
              console.log('[OK] Wrote to registry.');
            }
          });
        },
      );
    } catch (err) {
      console.log(err);
    }
  };

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
          // Sort folders based on the latest log file in each folder
          const aLatest = a.files[0]?.lastModified || 0;
          const bLatest = b.files[0]?.lastModified || 0;
          return bLatest - aLatest;
        });

      return sortedData;
    } catch (error) {
      console.error(error);
      return [];
    }
  });
  // settheme
  ipcMain.handle('setTitleBarOverlay', async (event, args) => {
    mainWindow?.setTitleBarOverlay({
      color: args === 'dark' ? '#272727' : '#1976d2',
      symbolColor: args === 'dark' ? '#74b1be' : '#ffffff',
      height: 63,
    });
  });

  ipcMain.handle('getLogContent', async (event, args) => {
    try {
      const logPath = args;
      const content = fs.readFileSync(logPath, 'utf-8');
      return content;
    } catch (error) {
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
      console.error(error);
      return null;
    }
  });

  // replayExists
  ipcMain.handle('replayExists', async (event, args) => {
    try {
      const { exePath, name } = args;
      const replaysFolder = path.join(
        path.dirname(path.dirname(exePath)),
        'Replays',
      );

      return fs.existsSync(path.join(replaysFolder, name));
    } catch (error) {
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
      console.error(error);
      return false;
    }
  });

  let downloading = false;
  let curDownloadItem: DownloadItem;

  const updateCurrentDownloadItem = (item: DownloadItem) => {
    curDownloadItem = item;
  };

  async function downloadGame(
    filedirectory: any,
    fileName: string,
    url: string,
    i: number,
    win: BrowserWindow,
  ) {
    try {
      await download(win, url, {
        directory: filedirectory,
        showBadge: true,
        filename: fileName,
        showProgressBar: true,
        overwrite: true,
        onStarted: (item) => updateCurrentDownloadItem(item),
        onProgress: (status) => {
          status.percent = Math.round(status.percent * 100); // Convert to percentage and round
          sendStatusToWindow(
            mainWindow as BrowserWindow,
            `Downloading: ${fileName} ${status.percent}%`,
          );
        },
        onCancel(item) {
          sendStatusToWindow(
            mainWindow as BrowserWindow,
            `Error Switching branch`,
          );
        },
      });
      return true;
    } catch (error) {
      console.error(error);
      sendStatusToWindow(mainWindow as BrowserWindow, `Error Switching branch`);
      return false;
    }
  }

  async function downloadFiles(
    index: number,
    lines: string[],
    dir: string,
    filedirectory: string,
    win: BrowserWindow,
  ) {
    if (index >= lines.length) return;
    if (!downloading) return;
    const line = lines[index];
    const [file, _, totalBytesStr] = line.split(':');
    const totalBytes = Number(totalBytesStr);

    if (file === 'f') {
      downloading = false;
      return;
    }

    const newFile = file.replace(/\\/g, '/');
    mainWindow?.webContents.send('download progress', {
      id: index,
      fileName: file,
      status: { percent: 0, transferredBytes: 0, totalBytes: 0 },
    });

    if (fs.existsSync(`${dir}/${newFile}`)) {
      const stats = fs.statSync(`${dir}/${newFile}`);
      if (stats.size === totalBytes) {
        mainWindow?.webContents.send('download complete', {
          id: index,
          fileName: file,
        });
        downloadFiles(index + 1, lines, dir, filedirectory, win);
        return;
      }
    }

    await downloadGame(dir, file, `${filedirectory}/${newFile}`, index, win);
    mainWindow?.webContents.send('download complete', {
      id: index,
      fileName: file,
    });

    downloadFiles(index + 1, lines, dir, filedirectory, win);
  }

  ipcMain.on('downloadGame', async (event, dir) => {
    try {
      console.log('Downloading game to:', dir);
      downloading = true;
      const win = BrowserWindow.getFocusedWindow();
      if (!win) {
        return;
      }
      let dl = await download(win, 'https://media.evos.live/getfileurls.json', {
        directory: dir,
        showBadge: false,
        showProgressBar: false,
        overwrite: true,
      });
      const fileUrls = await fs.promises.readFile(dl.getSavePath(), 'utf-8');
      fs.unlinkSync(dl.getSavePath());
      const { manifest, filedirectory } = JSON.parse(fileUrls);
      dl = await download(win, manifest, {
        directory: dir,
        showBadge: false,
        showProgressBar: false,
        overwrite: true,
      });
      const manifestContent = await fs.promises.readFile(
        dl.getSavePath(),
        'utf-8',
      );
      fs.unlinkSync(dl.getSavePath());
      const lines = manifestContent.split('\n');
      lines.shift();
      console.log('Downloading files...');

      await downloadFiles(0, lines, dir, filedirectory, win);
      console.log('Downloading Complete');
    } catch (error) {
      if (error instanceof electronDl.CancelError) {
        console.info('item.cancel() was called');
      } else {
        console.error(error);
      }
    }
  });

  ipcMain.on('cancelDownload', async (event, dir) => {
    downloading = false;
    if (curDownloadItem) {
      curDownloadItem.cancel();
    }
  });

  ipcMain.handle('open-folder', async (event, args) => {
    try {
      shell.openPath(args);
    } catch (error) {
      console.error(error);
    }
  });

  ipcMain.on(
    'launch-game',
    async (event: IpcMainEvent, args: { launchOptions: LaunchOptions }) => {
      const { launchOptions } = args;
      let enableAllChat = 'true';
      let selectedArguments = {};

      try {
        const config = await readConfig();
        enableAllChat = config?.showAllChat || 'true';
        selectedArguments = config?.selectedArguments || {};
      } catch (error) {
        log.info('Error while reading the config file:', error);
      }
      applyAllChat(enableAllChat);

      trackEvent('Game Launched');

      if (launchOptions.ticket) {
        const { ticket } = launchOptions;
        const tempPath = app.getPath('temp');
        const authTicketPath = path.join(tempPath, 'authTicket.xml');

        try {
          fs.writeFileSync(authTicketPath, ticket, 'utf-8');
          const launchOptionsWithTicket = [
            '-s',
            `${launchOptions.ip}:${launchOptions.port}`,
            '-t',
            authTicketPath,
          ];
          if (
            launchOptions.noLogEnabled !== undefined &&
            launchOptions.noLogEnabled !== 'false'
          ) {
            launchOptionsWithTicket.push('-nolog');
          }

          Object.entries(selectedArguments).forEach(([key, value]) => {
            const formattedValue = value !== null ? `=${value}` : '';
            launchOptionsWithTicket.push(`-o`);
            launchOptionsWithTicket.push(`${key}${formattedValue}`);
          });

          event.reply('setActiveGame', [launchOptions.name, true]);

          // Make sure we create a Log folder if it doesn't exist
          const logFolderPath = path.join(
            path.dirname(path.dirname(launchOptions.exePath)),
            'Logs',
          );
          createFolderIfNotExists(logFolderPath);

          games[launchOptions.name] = spawn(
            launchOptions.exePath,
            launchOptionsWithTicket,
            { cwd: path.dirname(launchOptions.exePath) },
          );
          let error = false;
          games[launchOptions.name].on('close', () => {
            event.reply('setActiveGame', [launchOptions.name, false]);
            if (!error) {
              sendStatusToWindow(mainWindow as BrowserWindow, '');
            }
            error = false;
            delete games[launchOptions.name];
          });
          games[launchOptions.name].on('error', (err) => {
            event.reply('setActiveGame', [launchOptions.name, false]);
            sendStatusToWindow(
              mainWindow as BrowserWindow,
              `Error launching the game for ${launchOptions.name}: ${err.message}`,
            );
            error = true;
            delete games[launchOptions.name];
          });
        } catch (e) {
          log.info('Failed to write file', e);
        }
      } else {
        const launchOptionsWithoutTicket = [
          '-s',
          `${launchOptions.ip}:${launchOptions.port}`,
        ];
        if (
          launchOptions.noLogEnabled !== undefined &&
          launchOptions.noLogEnabled !== 'false'
        ) {
          launchOptionsWithoutTicket.push('-nolog');
        }
        if (launchOptions.config !== undefined && launchOptions.config !== '') {
          launchOptionsWithoutTicket.push('-c', launchOptions.config);
        }

        Object.entries(selectedArguments).forEach(([key, value]) => {
          const formattedValue = value !== null ? `=${value}` : '';
          launchOptionsWithoutTicket.push(`-o`);
          launchOptionsWithoutTicket.push(`${key}${formattedValue}`);
        });

        event.reply('setActiveGame', [launchOptions.name, true]);

        // Make sure we create a Log folder if it doesn't exist
        const logFolderPath = path.join(
          path.dirname(path.dirname(launchOptions.exePath)),
          'Logs',
        );
        createFolderIfNotExists(logFolderPath);
        let error = false;
        games[launchOptions.name] = spawn(
          launchOptions.exePath,
          launchOptionsWithoutTicket,
          { cwd: path.dirname(launchOptions.exePath) },
        );
        games[launchOptions.name].on('close', () => {
          event.reply('setActiveGame', [launchOptions.name, false]);
          if (!error) {
            sendStatusToWindow(mainWindow as BrowserWindow, '');
          }
          error = false;
          delete games[launchOptions.name];
        });
        games[launchOptions.name].on('error', (err) => {
          event.reply('setActiveGame', [launchOptions.name, false]);
          sendStatusToWindow(
            mainWindow as BrowserWindow,
            `Error launching the game for ${launchOptions.name}: ${err.message}`,
          );
          error = true;
          delete games[launchOptions.name];
        });
      }
    },
  );

  ipcMain.on('getAssetPath', (event) => {
    const assetPath = getAssetPath('./');
    event.reply('getAssetPath', assetPath);
  });

  ipcMain.on('openUrl', async (event, args) => {
    console.log('Opening url:', args);
    shell.openExternal(args);
  });

  ipcMain.handle('translateReturn', async (event, arg) => {
    if (translatedText === '') {
      translatedText = arg;
    }
  });

  ipcMain.handle('getVersion', async () => {
    return currentVersion;
  });

  ipcMain.handle('checkVersion', async () => {
    autoUpdater.checkForUpdates();
  });

  ipcMain.handle('search-for-game', async (event) => {
    console.log('Searching for the game');
    const targetAppId = '402570';
    let searchGamePatch = null;
    let foundGamePath = null;

    // windows
    try {
      const regKey = [
        'HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam',
        'HKLM\\SOFTWARE\\Valve\\Steam',
      ];

      const registryList = await regedit.promisified.list(regKey);
      console.log(registryList);

      if (registryList[regKey[0]]?.values?.InstallPath?.value) {
        searchGamePatch = registryList[regKey[0]]?.values?.InstallPath?.value;
      }

      if (registryList[regKey[1]]?.values?.InstallPath?.value) {
        searchGamePatch = registryList[regKey[1]]?.values?.InstallPath?.value;
      }
    } catch (err) {
      console.log(err);
    }

    try {
      if (searchGamePatch) {
        const vdfPath = `${searchGamePatch}\\steamapps\\libraryfolders.vdf`;
        const pathOfGame = await readAndParseVDF(vdfPath, targetAppId);
        if (pathOfGame) {
          console.log(`Path for appid ${targetAppId}: ${pathOfGame}`);
          foundGamePath = `${pathOfGame}\\steamapps\\common\\Atlas Reactor\\Games\\Atlas Reactor\\Live\\Win64\\AtlasReactor.exe`;
        } else {
          console.log(`Appid ${targetAppId} not found.`);
        }
      } else {
        console.log('Steam installation path not found.');
      }
    } catch (error) {
      console.error('Error reading or parsing the VDF file:', error);
    }

    // Steam Deck?
    if (!foundGamePath) {
      try {
        const vdfPath = `Z:\\home\\deck\\.local\\share\\Steam\\steamapps\\libraryfolders.vdf`;
        const pathOfGame = await readAndParseVDF(vdfPath, targetAppId);
        if (pathOfGame) {
          console.log(`Path for appid ${targetAppId}: ${pathOfGame}`);
          foundGamePath = convertLinuxPathToWindows(
            `${pathOfGame}`,
            'steamapps/common/Atlas Reactor/Games/Atlas Reactor/Live/Win64/AtlasReactor.exe',
          );
        } else {
          console.log(`Appid ${targetAppId} not found.`);
        }
      } catch (error) {
        console.error('Error reading or parsing the VDF file:', error);
      }
    }

    if (!foundGamePath) {
      return null;
    }

    foundGamePath = foundGamePath.replace(/\\\\/g, '\\');
    return foundGamePath;
  });

  ipcMain.handle('quitAndInstall', async () => {
    autoUpdater.quitAndInstall(true, true);
  });

  ipcMain.handle('open-file-dialog', async (event, config) => {
    if (config) {
      const files = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          {
            name: await translate('Atlas Reactor Config'),
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
          name: await translate('Atlas Reactor Executable'),
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
    worker?.terminate();
  });

  // ipcMain.handle('download-game', async (event, downloadPath: string) => {
  //   if (oauthConfig.client_id !== '') {
  //     if (!authClient || !authClient.isListening()) {
  //       authClient = new AuthClient(oauthConfig);
  //     }
  //     authClient.openBrowser();
  //     isLinking = false;
  //     globalDownloadPath = downloadPath;
  //   } else {
  //     mainWindow?.webContents.send('download-progress-completed', {
  //       text: await translate('unexpectedError'),
  //     });
  //   }
  // });

  ipcMain.handle('download-game', async (event, downloadPath: string) => {
    globalDownloadPath = downloadPath;
    startDownload(globalDownloadPath);
  });

  ipcMain.handle('link-account', async (event, authUser: AuthUser) => {
    if (oauthConfig.client_id !== '') {
      if (!authClient || !authClient.isListening()) {
        authClient = new AuthClient(oauthConfig);
      }
      authClient.openBrowser();
      isLinking = true;
      user = authUser;
    }
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

  ipcMain.handle('start-discord-rpc', async () => {
    if (isDiscordRPCConnected) {
      const config = await readConfig();
      if (config?.enableDiscordRPC === 'true') {
        // Only show when in game
        // client.setActivity({
        //   details: 'Idling in Launcher',
        //   state: 'Waiting to start playing',
        //   largeImageKey: 'logo',
        //   // startTimestamp: discordTimestamp,
        //   buttons: [
        //     {
        //       label: 'Start playing!',
        //       url: 'https://evos.live/discord',
        //     },
        //   ],
        // });
      }
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

  ipcMain.handle('join-discord-channel', async (event, args: discordStatus) => {
    if (isDiscordRPCConnected) {
      // client.createLobby
    }
  });

  ipcMain.handle('stop-discord-rpc', async () => {
    client.clearActivity();
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
      console.log('Error while checking the branch:', error);
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
      const processFile = async (file: { path: any; checksum: any }) => {
        const filePath = path.join(basePath, file.path);

        if (fs.existsSync(filePath)) {
          try {
            const isAccessible = await checkFileAccessibility(filePath);

            if (!isAccessible) {
              log.info(`File is not accessible: ${filePath}`);
              failedDownloadReasons = `File is not accessible: ${filePath}`;
              return false;
            }

            const actualChecksum = await calculateFileChecksum(filePath);
            const isChecksumValid =
              actualChecksum.toUpperCase() === file.checksum.toUpperCase();

            if (!isChecksumValid) {
              return await downloadGame(
                basePath,
                file.path,
                `https://builds.evos.live/${args.path}/${file.path}`,
                0,
                mainWindow as BrowserWindow,
              );
            }
            return true;
          } catch (error) {
            log.info(`Error while processing file: ${file.path}`, error);
            // @ts-ignore
            failedDownloadReasons = error.toString();
            return false;
          }
        } else {
          return downloadGame(
            basePath,
            file.path,
            `https://builds.evos.live/${args.path}/${file.path}`,
            0,
            mainWindow as BrowserWindow,
          );
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

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      setTimeout(() => {
        if (!splash.isDestroyed()) {
          splash.close();
        }
        if (mainWindow) {
          mainWindow.show();

          if (process.env.NODE_ENV === 'development') {
            currentVersion = require('../../release/app/package.json').version;
          } else {
            currentVersion = app.getVersion();
          }
          trackEvent('Launcher Started', {
            version: currentVersion,
          });
          mainWindow.setMenu(null);
        }
      }, 2000);
    }

    autoUpdater.on('checking-for-update', async () => {
      sendStatusToWindow(
        mainWindow as BrowserWindow,
        await translate('checkUpdate'),
      );
    });
    autoUpdater.on('update-available', async () => {
      sendStatusToWindow(
        mainWindow as BrowserWindow,
        await translate('Update available.'),
      );
    });
    autoUpdater.on('update-not-available', () => {
      sendStatusToWindow(mainWindow as BrowserWindow, '');
    });
    autoUpdater.on('error', (err) => {
      sendStatusToWindow(
        mainWindow as BrowserWindow,
        `Error in auto-updater. ${err}`,
      );
    });
    autoUpdater.on('download-progress', async (progressObj) => {
      let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
      logMessage = `${logMessage} - Downloaded ${progressObj.percent.toFixed(
        2,
      )}%`;
      logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
      sendStatusToWindow(mainWindow as BrowserWindow, logMessage);
    });
    autoUpdater.on('update-downloaded', async () => {
      sendStatusToWindow(mainWindow as BrowserWindow, 'updateDownloaded');
    });
    autoUpdater.checkForUpdates();
  });

  mainWindow.on('close', async function (e) {
    e.preventDefault();
    // if any games running
    if (Object.keys(games).length > 0) {
      const { response } = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: await translate('closeLauncher'),
      });
      if (response === 0) {
        app.exit();
      }
    } else {
      app.exit();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  app.on(
    'certificate-error',
    (event, webContents, url, error, certificate, callback) => {
      // Prevent having error
      event.preventDefault();
      // and continue
      callback(true);
    },
  );

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(log.info);
