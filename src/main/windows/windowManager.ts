/**
 * @fileoverview Window management utilities for creating and configuring Electron windows
 * Handles main window and splash screen creation with proper configuration for development and production.
 * Manages window lifecycle, devtools installation, and window sizing/positioning.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import { BrowserWindow, app } from 'electron';
import path from 'path';
import { resolveHtmlPath } from '../util';
import install, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  // eslint-disable-next-line global-require
  require('electron-debug');
}

/**
 * Installs development extensions for debugging purposes.
 * Only runs in development mode.
 *
 * @returns A promise that resolves when extensions are installed
 */
async function installExtensions(): Promise<void> {
  await app.whenReady();

  try {
    const extensionName = await install(REACT_DEVELOPER_TOOLS);
    // eslint-disable-next-line no-console
    console.log(`Added Extension: ${extensionName}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('An error occurred installing extensions:', error);
  }
}

/**
 * Creates and configures the main application window.
 * Sets up window properties, web preferences, and loads the main HTML file.
 * In debug mode, it will also install development extensions.
 *
 * @returns A promise that resolves to the configured BrowserWindow instance
 */
export async function createMainWindow(): Promise<BrowserWindow> {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  /**
   * Helper function to construct asset paths.
   *
   * @param paths - Path segments to join with the resources path
   * @returns The complete path to the asset
   */
  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const mainWindow = new BrowserWindow({
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
        : path.join(__dirname, '../../../.erb/dll/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  mainWindow.webContents.session.clearCache();
  mainWindow.loadURL(resolveHtmlPath('index.html'));
  return mainWindow;
}

/**
 * Creates and configures a splash screen window.
 * This window is displayed during application startup.
 *
 * @returns A configured BrowserWindow instance for the splash screen
 */
export function createSplashWindow(): BrowserWindow {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../../assets');

  /**
   * Helper function to construct asset paths for splash window.
   *
   * @param paths - Path segments to join with the resources path
   * @returns The complete path to the asset
   */
  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const splash = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    show: false, // Don't show immediately, we'll control this manually
    skipTaskbar: true,
    resizable: false,
    icon: getAssetPath('logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  splash.loadFile(getAssetPath('splash.html'));

  // Show splash after it's fully loaded to prevent flickering
  splash.once('ready-to-show', () => {
    splash.show();
  });

  return splash;
}
