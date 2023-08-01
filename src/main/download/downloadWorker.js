/* eslint-disable no-constant-condition */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unused-vars */
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const util = require('util');

const delayCheckFiles = 100;
const delayDownloadFiles = 1000;
const globaldownloadFile = 'https://media.addalyn.baby/getfileurls.json';
const downloadOptions = {
  manifest: '',
  filedirectory: '',
};

async function streamWithProgress(length, reader, writer, progressCallback) {
  let bytesDone = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (progressCallback) {
        progressCallback(length, 100);
      }
      return;
    }

    if (!value || value.length === 0) {
      throw new Error('Empty chunk received during download');
    } else {
      writer.write(Buffer.from(value));
      if (progressCallback) {
        bytesDone += value.length;
        const percent =
          length === 0 ? null : Math.floor((bytesDone / length) * 100);
        progressCallback(bytesDone, percent);
      }
    }
  }
}

async function download(sourceUrl, targetFile, progressCallback) {
  const request = new Request(sourceUrl, {
    headers: new Headers({
      'Content-Type': 'application/octet-stream',
      'User-Agent': 'Evos Launcher',
    }),
  });

  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(
      `Unable to download, server returned ${response.status} ${response.statusText}`
    );
  }

  const { body } = response;
  if (!body) {
    throw new Error('No response body');
  }

  const finalLength = Number(response.headers.get('Content-Length')) || 0;
  const reader = body.getReader();
  const writer = fs.createWriteStream(targetFile);

  await streamWithProgress(finalLength, reader, writer, progressCallback);
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
      data: 'Error while downloading files sequentially',
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
