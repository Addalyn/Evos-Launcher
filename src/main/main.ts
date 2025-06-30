/**
 * @fileoverview Main process entry point for the Evos Launcher Electron application
 * Initializes the main window, Discord RPC, analytics, and handles application lifecycle events.
 * This file orchestrates the startup sequence and manages global application state.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

/* eslint global-require: off, no-console: off, promise/always-return: off */
import { BrowserWindow, app, shell } from 'electron';
import path from 'path';
import regedit from 'regedit';
import log from 'electron-log';

// Initialize modules
import {
  initializeDiscordRPC,
  authResult,
  authResultLinked,
  setMainWindow,
} from './services/discordService';
import { initializeAnalytics } from './services/downloadService';
import { createConfigFile } from './config';
import { createMainWindow, createSplashWindow } from './windows/windowManager';
import { setAuthCallbacks } from './discord/services/auth';
import {
  setupIpcHandlers,
  setupGlobalShortcuts,
  setupAutoUpdater,
  setupWindowCloseHandler,
} from './handlers/ipcHandlers';

// Initialize analytics
initializeAnalytics();

// Initialize Discord RPC
initializeDiscordRPC();

// Setup auth callbacks
setAuthCallbacks(authResult, authResultLinked);

// Setup VBS directory for registry operations
const vbsDirectory = path.join(
  path.dirname(app.getPath('exe')),
  './resources/assets/vbs',
);
regedit.setExternalVBSLocation(vbsDirectory);

let mainWindow: BrowserWindow | null = null;
log.transports.file.level = 'info';

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

/**
 * Creates and initializes the main application window
 * Sets up splash screen, IPC handlers, and event listeners
 * @returns Promise that resolves when window creation is complete
 */
const createWindow = async (): Promise<void> => {
  // Create splash window first (it will show itself when ready)
  const splash = createSplashWindow();

  // Create main window (hidden)
  mainWindow = await createMainWindow();

  // Set main window reference in Discord service
  setMainWindow(mainWindow);

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

        // Setup auto-updater after window is ready
        setupAutoUpdater(mainWindow);
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
