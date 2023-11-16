/* eslint-disable no-restricted-syntax */
/* eslint-disable no-useless-catch */
/* eslint-disable no-constant-condition */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unused-vars */
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const util = require('util');
const { default: axios } = require('axios');

const delayCheckFiles = 100;
const delayDownloadFiles = 500;
const globaldownloadFile = 'https://media.addalyn.baby/getfileurls.json';
const downloadOptions = {
  manifest: '',
  filedirectory: '',
};

async function writeChunk(writer, chunk) {
  return new Promise((resolve, reject) => {
    writer.write(Buffer.from(chunk), (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function streamWithProgress(length, stream, writer, progressCallback) {
  let bytesDone = 0;
  let lastUpdate = 0;
  const updateInterval = Math.ceil(length / 10); // Update every 10%

  try {
    for await (const chunk of stream) {
      if (!chunk || chunk.length === undefined) {
        throw new Error('Invalid chunk received during download');
      }

      if (chunk.length === 0) {
        throw new Error('Empty chunk received during download');
      }

      await writeChunk(writer, chunk);
      bytesDone += chunk.length;

      if (bytesDone - lastUpdate >= updateInterval) {
        const percent = Math.floor((bytesDone / length) * 100);
        if (progressCallback) {
          progressCallback(bytesDone, percent);
        }
        lastUpdate = bytesDone;
      }
    }
  } catch (error) {
    throw error;
  }

  if (progressCallback) {
    progressCallback(length, 100);
  }
}

async function download(sourceUrl, targetFile, progressCallback) {
  const response = await axios({
    method: 'get',
    url: sourceUrl,
    responseType: 'stream', // Specify the response type as stream for handling large files
    headers: {
      'Content-Type': 'application/octet-stream',
      'User-Agent': 'Evos Launcher',
    },
  });

  if (response.status !== 200) {
    throw new Error(
      `Unable to download, server returned ${response.status} ${response.statusText}`
    );
  }

  const { data } = response;
  const writer = fs.createWriteStream(targetFile);
  const finalLength = Number(response.headers['content-length']) || 0;
  progressCallback(0, 0);

  await streamWithProgress(finalLength, data, writer, progressCallback);
  writer.end();

  return true;
}

async function doDownloadFile(downloadPath, file, totalBytes) {
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
          data: {
            filePath,
            bytes: 0,
            totalBytes: 0,
            percent: 100,
          },
        });
        return true;
      }
    }

    await new Promise((resolve) => {
      setTimeout(async () => {
        const success = await download(fileUrl, filePath, (bytes, percent) =>
          parentPort.postMessage({
            type: 'progress',
            data: {
              fileUrl,
              filePath,
              bytes,
              percent,
              totalBytes,
            },
          })
        );

        setTimeout(() => {
          resolve(success);
        }, delayDownloadFiles);
      }, delayCheckFiles);
    });

    return true;
  } catch (error) {
    return false;
  }
}

async function downloadFilesSequentially(downloadPath, lines, index) {
  if (index >= lines.length) {
    return true;
  }

  const line = lines[index];
  const [file, _, totalBytesStr] = line.split(':');
  const totalBytes = Number(totalBytesStr);

  if (file === 'f') {
    return true;
  }

  try {
    const success = await doDownloadFile(downloadPath, file, totalBytes);
    return downloadFilesSequentially(downloadPath, lines, index + 1);
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      data: `Error while downloading files sequentially ${error}`,
    });
    return false;
  }
}

async function getGlobalFileUrls() {
  const request = new Request(globaldownloadFile, {
    headers: new Headers({
      'Content-Type': 'application/json',
      'User-Agent': 'Evos Launcher',
    }),
  });

  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(
      `Unable to download, server returned ${response.status} ${response.statusText}`
    );
  }

  const { manifest, filedirectory } = await response.json();
  downloadOptions.manifest = manifest;
  downloadOptions.filedirectory = filedirectory;
}

async function runWorker() {
  try {
    const { downloadPath } = workerData;
    await getGlobalFileUrls();

    const urlParts = downloadOptions.manifest.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const finish = await download(
      `${downloadOptions.manifest}`,
      `${downloadPath}/${fileName}`,
      (bytes, percent) => {
        parentPort.postMessage({
          type: 'progress',
          data: {
            filePath: fileName,
            bytes,
            percent,
          },
        });
      }
    );

    if (finish) {
      const manifest = await fs.promises.readFile(
        `${downloadPath}/${fileName}`,
        'utf-8'
      );

      const lines = manifest.split('\n');
      lines.shift();
      const success = await downloadFilesSequentially(downloadPath, lines, 0);

      parentPort.postMessage({ type: 'result', data: success });
    }
  } catch (error) {
    parentPort.postMessage({ type: 'error', data: error.message });
  }
}

runWorker();
