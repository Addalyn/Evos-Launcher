/* eslint-disable no-promise-executor-return */
/* eslint-disable consistent-return */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { AuthUser } from 'renderer/lib/EvosStore';

export type Channels =
  | 'getAssetPath'
  | 'open-file-dialog'
  | 'selected-file'
  | 'launch-game'
  | 'setActiveGame'
  | 'close-game';

const electronHandler = {
  isPackaged: process.env.NODE_ENV === 'production',
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
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
  },
  store: {
    isWriting: false,

    async setItem(key: string, value: string | AuthUser): Promise<void> {
      if (this.isWriting) {
        // If a write operation is already in progress, wait until it completes.
        await new Promise((resolve) => setTimeout(resolve, 100));
        return this.setItem(key, value);
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
