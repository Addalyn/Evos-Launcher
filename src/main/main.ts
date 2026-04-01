/**
 * @fileoverview Main process entry point for the Evos Launcher Electron application
 * Initializes the main window, Discord RPC, analytics, and handles application lifecycle events.
 * This file orchestrates the startup sequence and manages global application state.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

/* eslint global-require: off, no-console: off, promise/always-return: off */
import { BrowserWindow, app, shell, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import regedit from 'regedit';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';

// Initialize modules
import {
  initializeDiscordRPC,
  authResult,
  authResultLinked,
  setMainWindow,
} from './services/discordService';
import { createConfigFile } from './config';
import { createMainWindow, createSplashWindow } from './windows/windowManager';
import { setAuthCallbacks } from './discord/services/auth';
import {
  setupIpcHandlers,
  setupGlobalShortcuts,
  setupWindowCloseHandler,
  setupWindowMinimizeHandler,
} from './handlers/ipcHandlers';

// Initialize Discord RPC
initializeDiscordRPC();

// Setup auth callbacks
setAuthCallbacks(authResult, authResultLinked);

// Setup VBS directory for registry operations (Windows only)
if (process.platform === 'win32') {
  const vbsDirectory = path.join(
    path.dirname(app.getPath('exe')),
    './resources/assets/vbs',
  );
  regedit.setExternalVBSLocation(vbsDirectory);
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
log.transports.file.level = 'info';

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const launchMainWindow = async (splash: BrowserWindow) => {
  // Create main window (hidden)
  mainWindow = await createMainWindow();

  // Set main window reference in Discord service
  setMainWindow(mainWindow);

  // Setup Tray
  const getAssetPath = (...paths: string[]): string => {
    const RESOURCES_PATH = app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../assets');
    return path.join(RESOURCES_PATH, ...paths);
  };

  const iconPath = getAssetPath('logo.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);
  tray.setToolTip('Evos Launcher');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Restore',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.restore();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.restore();
      }
    }
  });

  // Setup all handlers and listeners
  setupGlobalShortcuts(mainWindow);
  setupIpcHandlers(mainWindow);
  createConfigFile();

  // Wait for window to be ready, content loaded, DOM ready, and a small buffer
  let isWindowReady = false;
  let isContentLoaded = false;
  let isDomReady = false;

  const showMainWindowWhenReady = () => {
    if (isWindowReady && isContentLoaded && isDomReady) {
      // Add a delay to ensure React components are fully rendered
      setTimeout(() => {
        if (!mainWindow) {
          throw new Error('Main window is not defined');
        }

        if (process.env.START_MINIMIZED) {
          mainWindow.minimize();
        } else {
          mainWindow.show();
        }

        // Ensure splash is properly closed
        if (splash && !splash.isDestroyed()) {
          splash.close();
        }
      }, 5000); // 5s delay to ensure React app is fully rendered
    }
  };

  mainWindow.on('ready-to-show', () => {
    isWindowReady = true;
    showMainWindowWhenReady();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    isContentLoaded = true;
    showMainWindowWhenReady();
  });

  mainWindow.webContents.on('dom-ready', () => {
    isDomReady = true;
    showMainWindowWhenReady();
  });

  setupWindowCloseHandler(mainWindow);
  setupWindowMinimizeHandler(mainWindow);

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

function getAppCacheDir() {
  const homedir = require('os').homedir(); // https://github.com/electron/electron/issues/1404#issuecomment-194391247

  let result;

  if (process.platform === 'win32') {
    result = process.env.LOCALAPPDATA || path.join(homedir, 'AppData', 'Local');
  } else if (process.platform === 'darwin') {
    result = path.join(homedir, 'Library', 'Application Support', 'Caches');
  } else {
    result = process.env.XDG_CACHE_HOME || path.join(homedir, '.cache');
  }

  return result;
}

/**
 * Creates and initializes the main application window
 * Sets up splash screen, IPC handlers, and event listeners
 * @returns Promise that resolves when window creation is complete
 */
const createWindow = async (): Promise<void> => {
  // Create splash window first (it will show itself when ready)
  const splash = createSplashWindow();

  // delete cache folder getAppCacheDir
  const cacheDir = path.join(getAppCacheDir(), 'evoslauncher-updater');
  log.info(`Clearing cache directory: ${cacheDir}`);
  try {
    await app.whenReady();
    await require('fs').promises.rm(cacheDir, { recursive: true, force: true });
    log.info('Cache directory cleared successfully');
  } catch (error) {
    log.error('Error clearing cache directory:', error);
  }

  // Listen for update events
  splash.webContents.on('did-finish-load', () => {
    splash.webContents.send('update-checking');

    const cleanupUpdaterListeners = () => {
      autoUpdater.removeAllListeners('checking-for-update');
      autoUpdater.on('checking-for-update', () => {}); // noop to prevent default behavior if any
      autoUpdater.removeAllListeners('update-available');
      autoUpdater.removeAllListeners('update-not-available');
      autoUpdater.removeAllListeners('download-progress');
      autoUpdater.removeAllListeners('update-downloaded');
      autoUpdater.removeAllListeners('error');
    };

    // Fallback: If no update events are received within 5 seconds, proceed to launch main window

    const timeout = setTimeout(() => {
      if (!splash.isDestroyed()) {
        splash.webContents.send('update-not-available');
      }
      setTimeout(() => {
        cleanupUpdaterListeners();
        launchMainWindow(splash);
      }, 1000);
    }, 5000);

    autoUpdater.on('checking-for-update', () => {
      if (!splash.isDestroyed()) {
        splash.webContents.send('update-checking');
      }
    });

    autoUpdater.on('update-available', () => {
      clearTimeout(timeout);
      if (!splash.isDestroyed()) {
        splash.webContents.send('update-available');
      }
    });

    autoUpdater.on('update-not-available', () => {
      clearTimeout(timeout);
      if (!splash.isDestroyed()) {
        splash.webContents.send('update-not-available');
      }
      // cleanup listeners as we are about to transition
      cleanupUpdaterListeners();
      // wait 1 second before launching main window
      setTimeout(() => {
        launchMainWindow(splash);
      }, 1000);
    });

    autoUpdater.on('download-progress', (progress: { percent: number }) => {
      try {
        clearTimeout(timeout);
        if (!splash.isDestroyed()) {
          splash.webContents.send('update-progress', progress);
        }
      } catch (error) {
        log.error('Error sending update progress:', error);
      }
    });

    autoUpdater.on('update-downloaded', () => {
      try {
        clearTimeout(timeout);
        if (!splash.isDestroyed()) {
          splash.webContents.send('update-downloaded');
        }
        cleanupUpdaterListeners();
        autoUpdater.quitAndInstall();
      } catch (error) {
        log.error('Error sending update downloaded:', error);
      }
    });

    autoUpdater.on('error', (err) => {
      log.error('Auto-updater error:', err);
      clearTimeout(timeout);
      cleanupUpdaterListeners();
      launchMainWindow(splash);
    });

    if (process.env.APP_EDITION === 'lite') {
      autoUpdater.channel = 'lite';
    } else {
      autoUpdater.channel = 'latest';
    }

    autoUpdater.checkForUpdates();
  });
};

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
    app.setAppUserModelId('Atlas Reactor - Evos Launcher');
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(log.info);

// Export functions that might be needed by other modules
// eslint-disable-next-line import/prefer-default-export
export { authResultLinked as setAuthResultLinked } from './services/discordService';
