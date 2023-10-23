/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable func-names */
/* eslint-disable import/no-cycle */
/* eslint-disable import/prefer-default-export */
/* eslint global-require: off, no-console: off, promise/always-return: off */
import path from 'path';
import fs from 'fs';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  globalShortcut,
  IpcMainEvent,
} from 'electron';
import regedit from 'regedit';
import { Worker as NativeWorker } from 'worker_threads';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { ChildProcess, spawn } from 'child_process';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { oauthConfig } from './discord/config/config';
import AuthClient from './discord/services/auth';

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
}

const defaultConfig: Config = {
  mode: 'dark',
  ip: '',
  authenticatedUsers: [],
  activeUser: null,
  exePath: '',
  gamePort: '6050',
  ticketEnabled: 'true',
};

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
let mainWindow: BrowserWindow | null = null;
let authClient: AuthClient | null = null;
log.transports.file.level = 'info';

const configFilePath = path.join(app.getPath('userData'), 'config.json');
let globalDownloadPath = '';

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
  log.info(text);
  win.webContents.send('message', text);
}

async function startDownload(downloadPath: string) {
  worker = new NativeWorker(path.join(__dirname, 'downloadWorker.js'), {
    workerData: { downloadPath },
  });

  worker.on('message', (message) => {
    switch (message.type) {
      case 'progress':
        mainWindow?.webContents.send('download-progress', message.data);
        break;
      case 'result':
        if (message.data) {
          mainWindow?.webContents.send('download-progress-completed', {
            text: 'Download/Repair complete!',
          });
        } else {
          mainWindow?.webContents.send('download-progress-completed', {
            text: 'Error while downloading files.',
          });
        }
        break;
      case 'error':
        mainWindow?.webContents.send('download-progress-completed', {
          text: `Error while downloading files.`,
        });
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

export const setAuthResult = (status: boolean) => {
  if (status) {
    startDownload(globalDownloadPath);
  } else {
    mainWindow?.webContents.send('download-progress-completed', {
      text: 'You must authenticate with our Discord server and have the correct role.',
    });
  }

  authClient?.stopListening();
};

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
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
    width: 1200,
    height: 728,
    minWidth: 800,
    minHeight: 400,
    autoHideMenuBar: true,
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

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  splash.loadURL(getAssetPath('splash.html'));
  splash.center();

  const fileExists = await fs.promises
    .access(configFilePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

  async function createConfigFile() {
    if (!fileExists) {
      log.info('Config file does not exist, creating it...');
      // Write the default config to the file
      await fs.promises.writeFile(
        configFilePath,
        JSON.stringify(defaultConfig, null, 2),
        'utf-8'
      );
    }
  }
  createConfigFile();
  ipcMain.handle('write-file', (event, args) => {
    fs.writeFileSync(
      configFilePath,
      JSON.stringify(args.data, null, 2),
      'utf-8'
    );
  });

  ipcMain.handle('read-file', async () => {
    try {
      const config = await fs.promises.readFile(configFilePath, 'utf-8');
      return JSON.parse(config);
    } catch (error) {
      log.info('Error while reading or creating the config file:', error);
      return null;
    }
  });

  ipcMain.handle('clear-file', () => {
    fs.writeFileSync(
      configFilePath,
      JSON.stringify(defaultConfig, null, 2),
      'utf-8'
    );
  });

  ipcMain.on('close-game', async (event, args) => {
    const { response } = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: 'Are you sure you want to close the game?',
    });
    if (response === 0) {
      event.reply('setActiveGame', [args, false]);
      games[args].kill();
    }
  });

  ipcMain.on(
    'launch-game',
    async (event: IpcMainEvent, args: { launchOptions: LaunchOptions }) => {
      const { launchOptions } = args;
      let enableAllChat = 1;
      try {
        const data = await fs.promises.readFile(configFilePath, 'utf-8');
        const config = JSON.parse(data);
        enableAllChat = config.showAllChat === 'true' ? 1 : 0;
      } catch (error) {
        log.info('Error while reading the config file:', error);
      }

      // Try Enabling All Chat based on config, will not work for the first time they launch the game, but works for any other times, and only on windows
      try {
        regedit.setExternalVBSLocation(getAssetPath('vbs'));
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
          }
        );
      } catch (err) {
        console.log(err);
      }

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
          event.reply('setActiveGame', [launchOptions.name, true]);
          games[launchOptions.name] = spawn(
            launchOptions.exePath,
            launchOptionsWithTicket
          );
          games[launchOptions.name].on('close', () => {
            event.reply('setActiveGame', [launchOptions.name, false]);
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
        event.reply('setActiveGame', [launchOptions.name, true]);
        games[launchOptions.name] = spawn(
          launchOptions.exePath,
          launchOptionsWithoutTicket
        );
        games[launchOptions.name].on('close', () => {
          event.reply('setActiveGame', [launchOptions.name, false]);
        });
      }
    }
  );

  ipcMain.on('getAssetPath', (event) => {
    const assetPath = getAssetPath('./');
    event.reply('getAssetPath', assetPath);
  });

  ipcMain.handle('open-file-dialog', async (event, config) => {
    if (config) {
      const files = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Atlas Reactor Config', extensions: ['json'] }],
      });

      const selectedFilePath = files.filePaths[0];

      if (selectedFilePath && selectedFilePath.endsWith('.json')) {
        return selectedFilePath;
      }
      return null;
    }

    const files = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Atlas Reactor Executable', extensions: ['exe'] }],
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

  ipcMain.handle('download-game', async (event, downloadPath: string) => {
    if (oauthConfig.client_id !== '') {
      if (!authClient || !authClient.isListening()) {
        authClient = new AuthClient(oauthConfig);
      }
      authClient.openBrowser();
      globalDownloadPath = downloadPath;
    } else {
      mainWindow?.webContents.send('download-progress-completed', {
        text: 'Unexpected error, please restart Evos Launcher.',
      });
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
        }
      }, 2000);
    }

    autoUpdater.on('checking-for-update', () => {
      sendStatusToWindow(mainWindow as BrowserWindow, 'Checking for update...');
    });
    autoUpdater.on('update-available', () => {
      sendStatusToWindow(mainWindow as BrowserWindow, 'Update available.');
    });
    autoUpdater.on('update-not-available', () => {
      sendStatusToWindow(mainWindow as BrowserWindow, '');
    });
    autoUpdater.on('error', (err) => {
      sendStatusToWindow(
        mainWindow as BrowserWindow,
        `Error in auto-updater. ${err}`
      );
    });
    autoUpdater.on('download-progress', (progressObj) => {
      let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
      logMessage = `${logMessage} - Downloaded ${progressObj.percent}%`;
      logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
      sendStatusToWindow(mainWindow as BrowserWindow, logMessage);
    });
    autoUpdater.on('update-downloaded', () => {
      sendStatusToWindow(
        mainWindow as BrowserWindow,
        'Update downloaded, Restart Evos Launcher to apply the update.'
      );
    });
    autoUpdater.checkForUpdates();
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
    }
  );

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

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
