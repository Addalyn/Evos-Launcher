/**
 * @fileoverview File utility functions for checksum calculation, access checks, and VDF parsing
 * Provides helper functions for file operations, Steam VDF file parsing, and file system validation.
 * Used throughout the application for file integrity checking and configuration parsing.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import fs from 'fs';
import * as crypto from 'crypto';
import path from 'path';
import { VDFObject } from '../types';

/**
 * Calculates the SHA1 checksum of a file
 * @param filePath - The path to the file to calculate checksum for
 * @returns Promise that resolves to the hex-encoded SHA1 checksum
 */
export async function calculateFileChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

/**
 * Checks if a file is accessible and writable
 * @param filePath - The file path to check accessibility for
 * @returns Promise that resolves to true if accessible, rejects with error otherwise
 */
export const checkFileAccessibility = (filePath: fs.PathLike) => {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.W_OK, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(true);
        } else if (err.code === 'EBUSY') {
          reject(new Error('File is locked or busy.'));
        } else {
          reject(new Error('Failed to access file.'));
        }
      } else {
        resolve(true);
      }
    });
  });
};

export const createFolderIfNotExists = (folderPath: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

export function convertLinuxPathToWindows(
  linuxPath: string,
  relativePath: string,
) {
  const pathParts = relativePath.split('/');
  const winPath = path.join('Z:', ...[linuxPath, ...pathParts]);
  return winPath;
}

export async function parseVDF(
  vdfString: string,
  targetAppId: string,
): Promise<string | undefined> {
  const lines = vdfString.split('\n');
  const stack: VDFObject[] = [];
  const result: VDFObject = {};
  let pathForAppId: string | undefined;
  let currentPath: string | undefined;

  lines.forEach((line) => {
    const matches = line.match(/"(.+?)"\s+"(.+?)"/);
    if (matches) {
      const key = matches[1];
      const value = matches[2];

      if (key === 'path') {
        currentPath = value;
      }

      if (stack.length === 0) {
        result[key] = value;
      } else {
        const currentObject = stack[stack.length - 1];
        currentObject[key] = value;
      }

      if (key === targetAppId) {
        pathForAppId = currentPath;
      }
    } else if (line.trim() === '{') {
      const newObject: VDFObject = {};
      if (stack.length === 0) {
        result.apps = newObject;
      } else {
        const currentObject = stack[stack.length - 1];
        currentObject.apps = newObject;
      }
      stack.push(newObject);
    } else if (line.trim() === '}') {
      stack.pop();
      if (stack.length === 0) {
        currentPath = undefined; // Reset path when exiting the top-level object
      }
    }
  });

  return pathForAppId;
}

export async function readAndParseVDF(filePath: string, targetAppId: string) {
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return parseVDF(data, targetAppId);
  } catch (error) {
    return null;
  }
}
