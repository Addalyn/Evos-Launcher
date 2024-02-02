/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-return-assign */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable consistent-return */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-async-promise-executor */
/* eslint-disable global-require */
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');

const delayCheckFiles = 100;
const delayDownloadFiles = 100;
const downloadOptions = { manifest: '', filedirectory: '' };

function download(url, location, oneTry, progressCallback) {
  const https = url.startsWith('https')
    ? require('follow-redirects').https
    : require('follow-redirects').http;
  return new Promise(async (resolve, reject) => {
    try {
      if (!url) reject('Undefined URL');
      if (await fs.pathExists(location)) await fs.remove(location);
      await fs.ensureFile(location);
      const target = fs.createWriteStream(location);
      https
        .get(url, (resp) => {
          const size = Number(resp.headers['content-length']);
          let bytesDone = 0;
          let lastUpdate = 0;
          const updateInterval = Math.ceil(size / 10);
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
          if (!oneTry) return download(url, location, true, progressCallback);
          fs.removeSync(target);
          reject(error);
        });
    } catch (e) {
      reject(e);
    }
  });
}

async function doDownloadFile(downloadPath, file, totalBytes, retryCount = 0) {
  try {
    const fileUrl = `${downloadOptions.filedirectory}/${file}`;
    const filePath = path.join(downloadPath, file);
    const dirPath = path.dirname(filePath);
    await fs.promises.mkdir(dirPath, { recursive: true });

    if (fs.existsSync(filePath)) {
      const stats = await util.promisify(fs.stat)(filePath);
      const fileSizeInBytes = stats.size;
      if (totalBytes !== fileSizeInBytes) fs.unlinkSync(filePath);
      else {
        parentPort.postMessage({
          type: 'progress',
          data: { filePath, bytes: 0, totalBytes: 0, percent: 100 },
        });
        return true;
      }
    }

    await new Promise((resolve) => {
      setTimeout(async () => {
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
            return doDownloadFile(
              downloadPath,
              file,
              totalBytes,
              retryCount + 1,
            );
          }
          parentPort.postMessage({
            type: 'error',
            data: `Failed to download file ${file} after 3 retries (report this to the developers)`,
          });
          throw new Error(`Failed to download file ${file} after 3 retries`);
        } else {
          resolve(success);
        }
      }, delayCheckFiles);
    });

    return true;
  } catch (error) {
    return false;
  }
}

async function downloadFilesSequentially(downloadPath, lines, index) {
  if (index >= lines.length) return true;

  const [file, _, totalBytesStr] = lines[index].split(':');
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
