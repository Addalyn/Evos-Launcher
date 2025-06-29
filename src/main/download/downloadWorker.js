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

/** @type {{manifest: string, filedirectory: string}} Download configuration options */
const downloadOptions = { manifest: '', filedirectory: '' };

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
        fs.unlinkSync(filePath);
      } else {
        parentPort.postMessage({
          type: 'progress',
          data: { filePath, bytes: 0, totalBytes: 0, percent: 100 },
        });
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
            (bytes, percent) =>
              parentPort.postMessage({
                type: 'progress',
                data: { fileUrl, filePath, bytes, percent, totalBytes },
              }),
          );

          const stats = await util.promisify(fs.stat)(filePath);
          const fileSizeInBytes = stats.size;
          if (totalBytes !== fileSizeInBytes) {
            fs.unlinkSync(filePath);
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
 * Downloads files sequentially from a manifest
 * @param {string} downloadPath - Base directory path for downloads
 * @param {string[]} lines - Array of manifest lines containing file info
 * @param {number} index - Current line index being processed
 * @returns {Promise<boolean>} Promise that resolves to true when all files are downloaded
 */
async function downloadFilesSequentially(downloadPath, lines, index) {
  if (index >= lines.length) return true;

  const [file, , totalBytesStr] = lines[index].split(':');
  const totalBytes = Number(totalBytesStr);

  if (file === 'f') return true;

  try {
    await doDownloadFile(downloadPath, file, totalBytes);
    return downloadFilesSequentially(downloadPath, lines, index + 1);
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      data: `Error while downloading files sequentially ${error} (report this to the developers)`,
    });
    return false;
  }
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
        parentPort.postMessage({
          type: 'progress',
          data: {
            filePath: fileName,
            bytes,
            percent,
          },
        });
      },
    );

    if (finish) {
      const manifest = await fs.promises.readFile(
        `${newDownloadPath}/${fileName}`,
        'utf-8',
      );

      const lines = manifest.split('\n');
      lines.shift();
      const success = await downloadFilesSequentially(
        newDownloadPath,
        lines,
        0,
      );

      parentPort.postMessage({ type: 'result', data: success });
    }
  } catch (error) {
    parentPort.postMessage({ type: 'error', data: error.message });
  }
}

runWorker();
