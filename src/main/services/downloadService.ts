/**
 * @fileoverview Download service for managing game file downloads and analytics
 * Handles worker thread management for downloads, progress tracking, and analytics initialization.
 * Provides functions for starting downloads and communicating with the download worker.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import { Worker as NativeWorker } from 'worker_threads';
import path from 'path';
import { app, BrowserWindow } from 'electron';
import { initialize, trackEvent } from '@aptabase/electron/main';
import { translate } from './translationService';

let worker: NativeWorker | null = null;

/**
 * Initializes analytics tracking with Aptabase
 * Sets up the analytics client with the specified app ID and host
 */
export function initializeAnalytics(): void {
  initialize('A-SH-9629286137', {
    host: 'https://launcher.evos.live',
  });
}

/**
 * Starts the download process using a worker thread
 * @param downloadPath - The local directory path where files should be downloaded
 * @param mainWindow - The main Electron window for sending progress updates
 * @returns Promise that resolves when download initialization is complete
 */
export async function startDownload(
  downloadPath: string,
  mainWindow: BrowserWindow | null,
): Promise<void> {
  const workerPath = app.isPackaged
    ? path.join(
        process.resourcesPath,
        'app',
        'dist',
        'main',
        'download',
        'downloadWorker.js',
      )
    : path.join(__dirname, '..', 'download', 'downloadWorker.js');

  worker = new NativeWorker(workerPath, {
    workerData: {
      downloadPath,
      globalDownloadFile: 'https://media.evos.live/getfileurls.json',
      skipNewPath: false,
    },
  });

  worker.on('message', async (message) => {
    switch (message.type) {
      case 'progress':
        mainWindow?.webContents.send('download-progress', message.data);
        break;
      case 'heartbeat':
        // Send heartbeat to renderer to show download is still active
        mainWindow?.webContents.send('download-heartbeat', message.data);
        break;
      case 'result':
        if (message.data) {
          trackEvent('Game Downloaded');
          const completeMessage = await translate(
            'downloadComplete',
            mainWindow,
          );
          mainWindow?.webContents.send('download-progress-completed', {
            text: completeMessage,
          });
        } else {
          const errorMessage = await translate('errorDownloading', mainWindow);
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
          const errorMessage = await translate('errorDownloading', mainWindow);
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
    // eslint-disable-next-line no-console
    console.error('Worker thread error:', error);
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      // eslint-disable-next-line no-console
      console.error('Worker thread exited with code:', code);
    }
  });
}

export function terminateDownload(): void {
  worker?.terminate();
}

export { trackEvent };
