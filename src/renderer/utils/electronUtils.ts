/**
 * @fileoverview Electron environment utilities for cross-platform compatibility
 * Provides safe access to Electron APIs with fallbacks for web environments.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import { ElectronHandler } from 'main/preload';

/**
 * Checks if the application is running in an Electron environment
 * @returns {boolean} True if running in Electron, false if running in a web browser
 */
export function isElectronApp(): boolean {
  return typeof window !== 'undefined' && window.electron !== undefined;
}

/**
 * Gets the Electron handler if available, returns null if not in Electron environment
 * @returns {ElectronHandler | null} The Electron handler or null
 */
export function getElectron(): ElectronHandler | null {
  return isElectronApp() ? window.electron : null;
}

/**
 * Safely executes a function that requires Electron APIs
 * @param fn - Function that uses Electron APIs
 * @param fallback - Optional fallback value/function for web environment
 * @returns The result of the function or fallback value
 */
export function withElectron<T>(
  fn: (electron: ElectronHandler) => T,
  fallback?: T | (() => T),
): T | null {
  const electron = getElectron();
  if (electron) {
    return fn(electron);
  }

  if (fallback !== undefined) {
    return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
  }

  return null;
}

/**
 * Checks if specific Electron features are available
 */
export const electronFeatures = {
  get isAvailable() {
    return isElectronApp();
  },

  get hasStore() {
    return isElectronApp() && !!getElectron()?.store;
  },

  get hasIpcRenderer() {
    return isElectronApp() && !!getElectron()?.ipcRenderer;
  },

  get canDownload() {
    return isElectronApp() && !!getElectron()?.ipcRenderer?.downloadGame;
  },

  get canLaunchGame() {
    return isElectronApp() && !!getElectron()?.ipcRenderer?.searchForGame;
  },

  get hasFileSystem() {
    return isElectronApp() && !!getElectron()?.ipcRenderer?.getSelectedFile;
  },
};
