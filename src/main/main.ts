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

const vbsDirectory = path.join(
  path.dirname(app.getPath('exe')),
  './resources/assets/vbs',
);
regedit.setExternalVBSLocation(vbsDirectory);

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
  enablePatching: string;
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
  enablePatching: 'true',
};

let translatedText: string;

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

interface VDFObject {
  [key: string]: string | VDFObject;
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
  log.info(text);
  win.webContents.send('message', text);
}

let patching: boolean = true;

async function startDownloadPatch(downloadPath: string) {
  worker = new NativeWorker(
    path.join(
      __dirname,
      !app.isPackaged ? 'download/' : '',
      'downloadWorker.js',
    ),
    {
      workerData: {
        downloadPath,
        globalDownloadFile: 'https://misc.addalyn.baby/getfileurls.json',
        skipNewPath: true,
      },
    },
  );
  let timeout: string | number | NodeJS.Timeout | undefined;
  worker.on('message', async (message) => {
    switch (message.type) {
      case 'progress':
        // only get filename not patch message.data.filePath
        if (timeout) {
          clearTimeout(timeout);
        }
        const patchingMessage = await translate('patching');
        const completeMessage = await translate('complete');
        sendStatusToWindow(
          mainWindow as BrowserWindow,
          `${patchingMessage} ${path.basename(message.data.filePath)} (${
            message.data.percent
          }% ${completeMessage})`,
        );

        timeout = setTimeout(() => {
          sendStatusToWindow(mainWindow as BrowserWindow, '');
        }, 5000);

        break;
      case 'result':
        if (message.data) {
          sendStatusToWindow(mainWindow as BrowserWindow, '');
        } else {
          const errorMessage = await translate('errorPatching');
          sendStatusToWindow(
            mainWindow as BrowserWindow,
            `${errorMessage} ${message.data}`,
          );
        }
        patching = false;
        break;
      case 'error':
        const errorMessage = await translate('errorPatching');
        sendStatusToWindow(
          mainWindow as BrowserWindow,
          `${errorMessage} ${message.data}`,
        );
        patching = false;
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
        globalDownloadFile: 'https://media.addalyn.baby/getfileurls.json',
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

export const setAuthResult = async (status: boolean) => {
  if (status) {
    startDownload(globalDownloadPath);
  } else {
    const noDiscordAuth = await translate('noDiscordAuth');
    mainWindow?.webContents.send('download-progress-completed', {
      text: noDiscordAuth,
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
    height: 740,
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
      let enablePatching = 'false';

      try {
        const data = await fs.promises.readFile(configFilePath, 'utf-8');
        const config = JSON.parse(data);
        enableAllChat = config.showAllChat;
        enablePatching = config.enablePatching;
      } catch (error) {
        log.info('Error while reading the config file:', error);
      }
      applyAllChat(enableAllChat);

      event.reply('handleIsPatching', true);

      if (enablePatching === 'true') {
        patching = true;
        await startDownloadPatch(
          launchOptions.exePath.replace('Win64\\AtlasReactor.exe', ''),
        );
      } else {
        patching = false;
      }

      async function checkForPatchAndLaunch() {
        if (patching) {
          console.log('Waiting for patch to finish...');
          setTimeout(checkForPatchAndLaunch, 1000);
        } else {
          // Patching is done
          console.log('Patch finished. launch the game.');

          if (enablePatching === 'false') {
            const patchingDisabled = await translate('patchingDisabled');
            sendStatusToWindow(mainWindow as BrowserWindow, patchingDisabled);
          }

          const basePath = launchOptions.exePath.replace(
            'AtlasReactor.exe',
            '',
          );
          const testingJsonPath = `${basePath}AtlasReactor_Data\\Bundles\\scenes\\testing.json`;
          const testingBundlePath = `${basePath}AtlasReactor_Data\\Bundles\\scenes\\testing.bundle`;
          const skywaySnowBundlePath = `${basePath}AtlasReactor_Data\\Bundles\\scenes\\skywaysnow_environment.bundle`;

          let stopHere: boolean = false;
          const checkFile = async (filePath: fs.PathLike, message: string) => {
            console.log(`Checking for file: ${filePath}`);
            try {
              if (fs.existsSync(filePath)) {
                console.log('File exists!');
              } else {
                console.log('File does not exist.');
                stopHere = true;
                throw message;
              }
            } catch (error) {
              console.error('Error checking file existence:', error);
              const errorMessage = await translate(message);
              sendStatusToWindow(mainWindow as BrowserWindow, errorMessage);
              throw error;
            }
          };
          try {
            checkFile(testingJsonPath, `unableToLaunch1`);
            checkFile(testingBundlePath, `unableToLaunch2`);
            checkFile(skywaySnowBundlePath, `unableToLaunch3`);
          } catch (error) {
            // Handle any errors that may have occurred during file checks
            stopHere = true;
            console.error('Error during file checks:', error);
            event.reply('handleIsPatching', false);
            return;
          }

          if (stopHere) {
            event.reply('handleIsPatching', false);
            return;
          }

          event.reply('handleIsPatching', false);

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

              // Make sure we create a Log folder if it doesn't exist
              const logFolderPath = path.join(
                path.dirname(path.dirname(launchOptions.exePath)),
                'Logs',
              );
              createFolderIfNotExists(logFolderPath);

              games[launchOptions.name] = spawn(
                launchOptions.exePath,
                launchOptionsWithTicket,
              );
              games[launchOptions.name].on('close', () => {
                event.reply('setActiveGame', [launchOptions.name, false]);
                sendStatusToWindow(mainWindow as BrowserWindow, '');
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
            if (
              launchOptions.config !== undefined &&
              launchOptions.config !== ''
            ) {
              launchOptionsWithoutTicket.push('-c', launchOptions.config);
            }
            event.reply('setActiveGame', [launchOptions.name, true]);

            // Make sure we create a Log folder if it doesn't exist
            const logFolderPath = path.join(
              path.dirname(path.dirname(launchOptions.exePath)),
              'Logs',
            );
            createFolderIfNotExists(logFolderPath);

            games[launchOptions.name] = spawn(
              launchOptions.exePath,
              launchOptionsWithoutTicket,
            );
            games[launchOptions.name].on('close', () => {
              event.reply('setActiveGame', [launchOptions.name, false]);
              sendStatusToWindow(mainWindow as BrowserWindow, '');
              delete games[launchOptions.name];
            });
          }
        }
      }

      // Start waiting for the patch
      checkForPatchAndLaunch();
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

  ipcMain.handle('download-game', async (event, downloadPath: string) => {
    if (oauthConfig.client_id !== '') {
      if (!authClient || !authClient.isListening()) {
        authClient = new AuthClient(oauthConfig);
      }
      authClient.openBrowser();
      globalDownloadPath = downloadPath;
    } else {
      mainWindow?.webContents.send('download-progress-completed', {
        text: await translate('unexpectedError'),
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
      let logMessage = `${await translate('Download speed')}: ${progressObj.bytesPerSecond}`;
      logMessage = `${logMessage} - ${await translate('Downloaded')} ${progressObj.percent}%`;
      logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
      sendStatusToWindow(mainWindow as BrowserWindow, logMessage);
    });
    autoUpdater.on('update-downloaded', async () => {
      sendStatusToWindow(
        mainWindow as BrowserWindow,
        await translate('updateDownloaded'),
      );
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
