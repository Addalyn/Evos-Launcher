/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
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
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { ChildProcess, spawn } from 'child_process';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

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
}
class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const configFilePath = path.join(app.getPath('userData'), 'config.json');

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
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
    minWidth: 750,
    minHeight: 400,
    autoHideMenuBar: true,
    icon: getAssetPath('logo.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  globalShortcut.register('CmdOrCtrl+F12', () => {
    mainWindow?.webContents.toggleDevTools();
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  const fileExists = await fs.promises
    .access(configFilePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

  async function createConfigFile() {
    if (!fileExists) {
      console.log('Config file does not exist, creating it...');
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
      console.error('Error while reading or creating the config file:', error);
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
    (event: IpcMainEvent, args: { launchOptions: LaunchOptions }) => {
      const { launchOptions } = args;
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
          event.reply('setActiveGame', [launchOptions.name, true]);
          games[launchOptions.name] = spawn(
            launchOptions.exePath,
            launchOptionsWithTicket
          );
          games[launchOptions.name].on('close', () => {
            event.reply('setActiveGame', [launchOptions.name, false]);
          });
        } catch (e) {
          console.log('Failed to write file', e);
        }
      } else {
        const launchOptionsWithoutTicket = [
          '-s',
          `${launchOptions.ip}:${launchOptions.port}`,
        ];

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

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
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
  .catch(console.log);
