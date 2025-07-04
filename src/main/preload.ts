/**
 * @fileoverview Preload script that creates a secure bridge between the main process and renderer
 * Exposes safe APIs to the renderer process while maintaining security isolation.
 * Handles IPC communication, file operations, Discord integration, and authentication.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

/* eslint-disable no-promise-executor-return */
/* eslint-disable consistent-return */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { AuthUser } from 'renderer/lib/EvosStore';

/**
 * Discord Rich Presence status interface
 * @interface discordStatus
 * @property {string} [details] - Primary status text
 * @property {string} [state] - Secondary status text
 * @property {Array} [buttons] - Interactive buttons with label and URL
 * @property {Date} [startTimestamp] - Start time for elapsed time display
 * @property {string} [largeImageKey] - Large image asset key
 * @property {string} [largeImageText] - Large image hover text
 * @property {string} [smallImageKey] - Small image asset key
 * @property {string} [smallImageText] - Small image hover text
 */
interface discordStatus {
  details?: string;
  state?: string;
  buttons?: {
    label: string;
    url: string;
  }[];
  startTimestamp?: Date;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
}

/**
 * Game branch configuration interface
 * @interface branch
 * @property {string} path - File system path to the branch
 * @property {string} text - Display text for the branch
 * @property {boolean} enabled - Whether the branch is currently enabled
 * @property {boolean} devOnly - Whether this branch is for development only
 * @property {Array} files - Array of files with path and checksum information
 */
interface branch {
  path: string;
  text: string;
  enabled: boolean;
  devOnly: boolean;
  files: {
    path: string;
    checksum: string;
  }[];
}

export type Channels =
  | 'getAssetPath'
  | 'open-file-dialog'
  | 'search-for-game'
  | 'open-folder-dialog'
  | 'selected-file'
  | 'launch-game'
  | 'setActiveGame'
  | 'openUrl'
  | 'handleIsPatching'
  | 'close-game'
  | 'download-progress'
  | 'download-progress-completed'
  | 'cancel-download-game'
  | 'quitAndInstall'
  | 'set-show-all-chat'
  | 'getLogData'
  | 'getLogContent'
  | 'open-folder'
  | 'message'
  | 'translate'
  | 'translateReturn'
  | 'getReplayData'
  | 'getReplayContent'
  | 'downloadGame'
  | 'download progress'
  | 'download complete'
  | 'cancelDownload'
  | 'link-account'
  | 'linkedDiscord'
  | 'start-discord-rpc'
  | 'set-discord-rpc-status'
  | 'get-source-files'
  | 'read-file-content';

let storeStatus = '' as discordStatus;

const electronHandler = {
  isPackaged: process.env.NODE_ENV === 'production',
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    sendTranslate(channel: Channels, message: string) {
      ipcRenderer.invoke(channel, message);
    },
    invoke(channel: string, ...args: any[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    openFileDialog() {
      ipcRenderer.send('open-file-dialog');
    },
    getSelectedFile(config: boolean) {
      return ipcRenderer.invoke('open-file-dialog', config);
    },
    searchForGame() {
      return ipcRenderer.invoke('search-for-game');
    },
    openFolderDialog() {
      ipcRenderer.send('open-folder-dialog');
    },
    getSelectedFolder() {
      return ipcRenderer.invoke('open-folder-dialog');
    },
    downloadGame(downloadPath: string) {
      ipcRenderer.invoke('download-game', downloadPath);
    },
    cancelDownloadGame() {
      ipcRenderer.invoke('cancel-download-game');
    },
    restartApp() {
      ipcRenderer.invoke('quitAndInstall');
    },
    setShowAllChat(enabled: string) {
      ipcRenderer.invoke('set-show-all-chat', enabled);
    },
    getLogData(folder: string) {
      return ipcRenderer.invoke('getLogData', folder);
    },
    getLogContent(file: string) {
      return ipcRenderer.invoke('getLogContent', file);
    },
    openFolder(folder: string) {
      ipcRenderer.invoke('open-folder', folder);
    },
    getReplays(folder: string) {
      return ipcRenderer.invoke('getReplayData', folder);
    },
    getReplayContent(file: string) {
      return ipcRenderer.invoke('getReplayContent', file);
    },
    saveReplay(exePath: string, name: string, data: string) {
      return ipcRenderer.invoke('saveReplay', { exePath, name, data });
    },
    replayExists(exePath: string, name: string) {
      return ipcRenderer.invoke('replayExists', { exePath, name });
    },
    getVersion() {
      return ipcRenderer.invoke('getVersion');
    },
    checkVersion() {
      ipcRenderer.invoke('checkVersion');
    },
    setTheme(background: string, color: string) {
      ipcRenderer.invoke('setTitleBarOverlay', [background, color]);
    },
    linkAccount(authUser: AuthUser) {
      ipcRenderer.invoke('link-account', authUser as AuthUser);
    },
    startDiscord() {
      ipcRenderer.invoke('start-discord-rpc');
    },
    stopDiscord() {
      ipcRenderer.invoke('stop-discord-rpc');
    },
    sendDiscordStatus(status: discordStatus) {
      if (status === storeStatus) {
        return;
      }
      storeStatus = status;
      ipcRenderer.invoke('set-discord-rpc-status', status);
    },
    updateBranch(branch: branch) {
      ipcRenderer.invoke('update-branch', branch);
    },

    checkBranch(branch: branch) {
      ipcRenderer.invoke('check-branch', branch);
    },
    cancelDownloadBranch() {
      ipcRenderer.invoke('cancelDownload');
    },
    getSourceFiles() {
      return ipcRenderer.invoke('get-source-files');
    },
    readFileContent(filePath: string) {
      return ipcRenderer.invoke('read-file-content', filePath);
    },
  },
  store: {
    isWriting: false,

    async setItem(
      key: string,
      value: string | AuthUser | Record<string, string | null>,
    ): Promise<void> {
      if (this.isWriting) {
        // If a write operation is already in progress, wait until it completes.
        await new Promise((resolve) => setTimeout(resolve, 200));
        this.isWriting = false;
      }

      this.isWriting = true;
      try {
        let contents = await ipcRenderer.invoke('read-file');
        contents = contents || {};
        if (typeof contents === 'object' && !Array.isArray(contents)) {
          // If contents is an object, update the property with the given key.
          contents[key] = value;
        } else {
          // If contents is not an object or is an array, create a new object with the given key and value.
          const newContents: { [key: string]: any } = {};
          newContents[key] = value;
          contents.push(newContents);
        }
        await ipcRenderer.invoke('write-file', { data: contents });
      } finally {
        this.isWriting = false;
      }
    },

    async removeItem(key: string): Promise<void> {
      if (this.isWriting) {
        // If a write operation is already in progress, wait until it completes.
        await new Promise((resolve) => setTimeout(resolve, 100));
        return this.removeItem(key);
      }

      this.isWriting = true;
      try {
        const contents = await ipcRenderer.invoke('read-file');
        delete contents[key];
        await ipcRenderer.invoke('write-file', { data: contents });
      } finally {
        this.isWriting = false;
      }
    },

    async getItem(key: string) {
      const contents = await ipcRenderer.invoke('read-file');
      return contents[key] ?? null;
    },

    async clear() {
      await ipcRenderer.invoke('clear-file');
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
