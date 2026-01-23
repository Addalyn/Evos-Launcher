/**
 * @fileoverview Download worker for handling file downloads with progress tracking
 * This worker handles downloading game files from a remote server with retry logic
 * and progress reporting to the main thread.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

/* eslint-disable global-require */
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');

/** @constant {number} Delay between file checks in milliseconds */
const delayCheckFiles = 100;

/** @constant {number} Number of files to process in each batch */
const BATCH_SIZE = 5;

/** @constant {number} Minimum time between progress updates in milliseconds */
const PROGRESS_THROTTLE_MS = 100;

/** @constant {number} Heartbeat interval in milliseconds */
const HEARTBEAT_INTERVAL_MS = 2000;

/** @type {{manifest: string, filedirectory: string}} Download configuration options */
const downloadOptions = { manifest: '', filedirectory: '' };

/** @type {number} Timestamp of last progress update */
let lastProgressUpdate = 0;

/** @type {NodeJS.Timeout|null} Heartbeat timer */
let heartbeatTimer = null;

/**
 * Downloads a file from a URL to a local location with progress tracking
 * @param {string} url - The URL to download from
 * @param {string} location - Local file path to save the download
 * @param {boolean} oneTry - Whether this is a retry attempt
 * @param {Function} progressCallback - Callback function for progress updates (bytes, percent)
 * @returns {Promise<string>} Promise that resolves to the file location on success
 */
function download(url, location, oneTry, progressCallback) {
  const https = url.startsWith('https')
    ? require('follow-redirects').https
    : require('follow-redirects').http;

  return new Promise((resolve, reject) => {
    (async () => {
      try {
        if (!url) {
          reject(new Error('Undefined URL'));
          return;
        }

        if (await fs.pathExists(location)) {
          await fs.remove(location);
        }

        await fs.ensureFile(location);
        const target = fs.createWriteStream(location);

        https
          .get(url, (resp) => {
            const size = Number(resp.headers['content-length']);
            let bytesDone = 0;
            let lastUpdate = 0;
            const updateInterval = Math.ceil(size / 100);
            progressCallback(0, 0);

            resp.on('data', (chunk) => {
              bytesDone += chunk.length;
              if (bytesDone - lastUpdate >= updateInterval) {
                const percent = Math.floor((bytesDone / size) * 100);
                if (progressCallback) {
                  progressCallback(bytesDone, percent);
                }
                lastUpdate = bytesDone;
              }
            });

            resp.pipe(target);
            target.on('finish', () => {
              target.close();
              progressCallback(size, 100);
              resolve(location);
            });
          })
          .on('error', (error) => {
            if (!oneTry) {
              resolve(download(url, location, true, progressCallback));
              return;
            }
            fs.removeSync(target);
            reject(error);
          });
      } catch (e) {
        reject(e);
      }
    })();
  });
}

/**
 * Downloads a single file with retry logic and progress tracking
 * @param {string} downloadPath - Base directory path for downloads
 * @param {string} file - Relative file path to download
 * @param {number} totalBytes - Expected file size in bytes
 * @param {number} retryCount - Current retry attempt count
 * @returns {Promise<boolean>} Promise that resolves to true on success
 */
async function doDownloadFile(downloadPath, file, totalBytes, retryCount = 0) {
  try {
    const fileUrl = `${downloadOptions.filedirectory}/${file}`;
    const filePath = path.join(downloadPath, file);
    const dirPath = path.dirname(filePath);
    await fs.promises.mkdir(dirPath, { recursive: true });

    if (fs.existsSync(filePath)) {
      const stats = await util.promisify(fs.stat)(filePath);
      const fileSizeInBytes = stats.size;
      if (totalBytes !== fileSizeInBytes) {
        await fs.promises.unlink(filePath);
      } else {
        // File already exists with correct size
        const now = Date.now();
        if (now - lastProgressUpdate >= PROGRESS_THROTTLE_MS) {
          parentPort.postMessage({
            type: 'progress',
            data: { filePath, bytes: 0, totalBytes: 0, percent: 100 },
          });
          lastProgressUpdate = now;
        }
        return true;
      }
    }

    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const success = await download(
            fileUrl,
            filePath,
            false,
            (bytes, percent) => {
              const now = Date.now();
              if (now - lastProgressUpdate >= PROGRESS_THROTTLE_MS) {
                parentPort.postMessage({
                  type: 'progress',
                  data: { fileUrl, filePath, bytes, percent, totalBytes },
                });
                lastProgressUpdate = now;
              }
            },
          );

          const stats = await util.promisify(fs.stat)(filePath);
          const fileSizeInBytes = stats.size;
          if (totalBytes !== fileSizeInBytes) {
            await fs.promises.unlink(filePath);
            if (retryCount < 3) {
              const result = await doDownloadFile(
                downloadPath,
                file,
                totalBytes,
                retryCount + 1,
              );
              resolve(result);
              return;
            }
            parentPort.postMessage({
              type: 'error',
              data: `Failed to download file ${file} after 3 retries (report this to the developers)`,
            });
            throw new Error(`Failed to download file ${file} after 3 retries`);
          } else {
            resolve(success);
          }
        } catch (error) {
          resolve(false);
        }
      }, delayCheckFiles);
    });
  } catch (error) {
    return false;
  }
}

/**
 * Processes a batch of files from the manifest
 * @param {string} downloadPath - Base directory path for downloads
 * @param {string[]} lines - Array of manifest lines containing file info
 * @param {number} startIndex - Starting index for this batch
 * @param {number} batchSize - Number of files to process in this batch
 * @returns {Promise<{success: boolean, processedCount: number}>} Result of batch processing
 */
async function processBatch(downloadPath, lines, startIndex, batchSize) {
  const endIndex = Math.min(startIndex + batchSize, lines.length);
  let successCount = 0;

  for (let i = startIndex; i < endIndex; i++) {
    const [file, , totalBytesStr] = lines[i].split(':');
    const totalBytes = Number(totalBytesStr);

    if (file === 'f') {
      successCount++;
      continue;
    }

    try {
      const result = await doDownloadFile(downloadPath, file, totalBytes);
      if (result) {
        successCount++;
      }
    } catch (error) {
      parentPort.postMessage({
        type: 'error',
        data: `Error downloading file ${file}: ${error.message}`,
      });
    }
  }

  return {
    success: successCount === (endIndex - startIndex),
    processedCount: endIndex - startIndex,
  };
}

/**
 * Downloads files in batches from a manifest to prevent blocking
 * @param {string} downloadPath - Base directory path for downloads
 * @param {string[]} lines - Array of manifest lines containing file info
 * @returns {Promise<boolean>} Promise that resolves to true when all files are downloaded
 */
async function downloadFilesInBatches(downloadPath, lines) {
  let currentIndex = 0;
  const totalFiles = lines.length;

  while (currentIndex < totalFiles) {
    try {
      // Send heartbeat to show download is active
      parentPort.postMessage({
        type: 'heartbeat',
        data: {
          currentFile: currentIndex + 1,
          totalFiles,
          percent: Math.floor((currentIndex / totalFiles) * 100),
        },
      });

      const result = await processBatch(
        downloadPath,
        lines,
        currentIndex,
        BATCH_SIZE,
      );

      currentIndex += result.processedCount;

      // Yield control to prevent blocking
      await new Promise((resolve) => setImmediate(resolve));
    } catch (error) {
      parentPort.postMessage({
        type: 'error',
        data: `Error while downloading files in batch: ${error.message}`,
      });
      return false;
    }
  }

  return true;
}

/**
 * Fetches global file URLs from the download server
 * @param {string} globalDownloadFile - URL to fetch download configuration from
 * @returns {Promise<void>} Promise that resolves when URLs are fetched and stored
 */
async function getGlobalFileUrls(globalDownloadFile) {
  const response = await fetch(globalDownloadFile);

  if (!response.ok) {
    parentPort.postMessage({
      type: 'error',
      data: `Unable to download, server returned ${response.status} ${response.statusText} (report this to the developers)`,
    });
    throw new Error(
      `Unable to download, server returned ${response.status} ${response.statusText}`,
    );
  }

  const { manifest, filedirectory } = await response.json();
  downloadOptions.manifest = manifest;
  downloadOptions.filedirectory = filedirectory;
}

/**
 * Main worker function that orchestrates the download process
 * @returns {Promise<void>} Promise that resolves when the download process is complete
 */
async function runWorker() {
  try {
    const { downloadPath, globalDownloadFile, skipNewPath } = workerData;
    
    // Start heartbeat to show worker is alive
    heartbeatTimer = setInterval(() => {
      parentPort.postMessage({
        type: 'heartbeat',
        data: { status: 'active' },
      });
    }, HEARTBEAT_INTERVAL_MS);

    await getGlobalFileUrls(globalDownloadFile);

    const urlParts = downloadOptions.manifest.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const newDownloadPath = skipNewPath
      ? downloadPath
      : `${downloadPath}\\AtlasReactor`;

    if (!(await fs.pathExists(newDownloadPath)) && !skipNewPath) {
      await fs.promises.mkdir(newDownloadPath, {
        recursive: true,
      });
    }

    const finish = await download(
      downloadOptions.manifest,
      `${newDownloadPath}/${fileName}`,
      false,
      (bytes, percent) => {
        const now = Date.now();
        if (now - lastProgressUpdate >= PROGRESS_THROTTLE_MS) {
          parentPort.postMessage({
            type: 'progress',
            data: {
              filePath: fileName,
              bytes,
              percent,
            },
          });
          lastProgressUpdate = now;
        }
      },
    );

    if (finish) {
      const manifest = await fs.promises.readFile(
        `${newDownloadPath}/${fileName}`,
        'utf-8',
      );

      const lines = manifest.split('\n');
      lines.shift(); // Remove header line
      
      // Use batch processing instead of sequential
      const success = await downloadFilesInBatches(
        newDownloadPath,
        lines,
      );

      // Clear heartbeat timer
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }

      parentPort.postMessage({ type: 'result', data: success });
    }
  } catch (error) {
    // Clear heartbeat timer on error
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    parentPort.postMessage({ type: 'error', data: error.message });
  }
}

// Handle worker termination
parentPort.on('close', () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
});

runWorker();
