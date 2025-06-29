/**
 * @fileoverview Translation service for main process communication with renderer
 * Provides functions for requesting translations from the renderer process and sending status messages.
 * Handles asynchronous translation requests and inter-process communication for internationalization.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import { BrowserWindow } from 'electron';

let translatedText: string;

/**
 * Sends a status message to the renderer window
 * @param win - The browser window to send the message to
 * @param text - The message text to send
 */
export function sendStatusToWindow(win: BrowserWindow, text: string): void {
  win?.webContents?.send('message', text);
}

/**
 * Requests a translation from the renderer process
 * @param key - The translation key to translate
 * @param mainWindow - The main browser window to communicate with
 * @returns Promise that resolves to the translated text
 */
export function translate(
  key: string,
  mainWindow: BrowserWindow | null,
): Promise<string> {
  translatedText = ''; // Clear the translatedText before asking for a new translation
  mainWindow?.webContents.send('translate', key);

  return new Promise((resolve) => {
    const checkTranslation = () => {
      if (translatedText !== '') {
        resolve(translatedText);
      } else {
        setTimeout(checkTranslation, 500); // Wait for 500 milliseconds before checking again
      }
    };

    checkTranslation();
  });
}

export function setTranslatedText(text: string): void {
  translatedText = text;
}
