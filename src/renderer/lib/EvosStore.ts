/**
 * @fileoverview Global state management store for the Evos Launcher using Zustand
 * Manages application state including user authentication, settings, theming, and game configuration.
 * Provides persistent storage integration and state management across the entire renderer process.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import { create } from 'zustand';
/* eslint-disable no-console */
import { trackEvent } from '@aptabase/electron/renderer';

/**
 * Helper function to safely execute Electron operations
 */
const withElectron = <T>(
  fn: (electron: any) => T,
  fallback?: T | (() => T),
): T | null => {
  if (typeof window !== 'undefined' && window.electron) {
    return fn(window.electron);
  }

  if (fallback !== undefined) {
    return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
  }

  return null;
};

/**
 * Browser storage fallback functions for web mode
 */
const browserStorage = {
  async getItem(key: string): Promise<any> {
    try {
      const item = localStorage.getItem(`evos_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(`evos_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage for key ${key}:`, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(`evos_${key}`);
    } catch (error) {
      console.error(`Error removing from localStorage for key ${key}:`, error);
    }
  },

  clear(): void {
    try {
      // Only clear evos-related items
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('evos_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

/**
 * Interface representing an authenticated user
 * @interface AuthUser
 * @property {string} user - The username of the authenticated user
 * @property {string} token - Authentication token for the user
 * @property {string} handle - Display handle/name for the user
 * @property {number} banner - Banner ID for user customization
 * @property {string} [configFile] - Optional path to user's config file
 */
export interface AuthUser {
  user: string;
  token: string;
  handle: string;
  banner: number;
  configFile?: string;
}

export interface EvosStoreState {
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorText: string;
  colorScrollBar: string;
  colorPaper: string;
  setColorPrimary: (color: string) => void;
  setColorSecondary: (color: string) => void;
  setColorBackground: (color: string) => void;
  setColorText: (color: string) => void;
  setColorScrollBar: (color: string) => void;
  setColorPaper: (color: string) => void;
  getFromStorage(arg0: string): any;
  setToStorage: (key: string, value: any) => Promise<void>;
  removeFromStorage: (key: string) => Promise<void>;
  clearStorage: () => void;
  mode: string;
  ip: string;
  authenticatedUsers: AuthUser[];
  activeUser: AuthUser | null;
  age: number;
  exePath: string;
  folderPath: string;
  gamePort: string;
  ticketEnabled: string;
  isDownloading: boolean;
  noLogEnabled: string;
  showAllChat: string;
  setShowAllChat: (showAllChat: string) => Promise<void>;
  setIsDownloading: (isDownloading: boolean) => void;
  init: () => void;
  toggleMode: () => void;
  setIp: (ip: string) => Promise<void>;
  setAuthenticatedUsers: (
    user: string,
    token: string,
    handle: string,
    banner: number,
  ) => void;
  setGamePort: (gamePort: string) => void;
  setExePath: (exePath: string) => void;
  setFolderPath: (folderPath: string) => void;
  setTicketEnabled: (ticketEnabled: string) => void;
  setNoLogEnabled: (noLogEnabled: string) => void;
  updateAuthenticatedUsers: (
    user: string,
    token: string,
    handle: string,
    banner: number,
    configFile?: string,
  ) => void;
  switchUser: (user: string) => void;
  setDiscordId: (discord: number) => void;
  discordId: number;
  enableDiscordRPC: string;
  toggleDiscordRPC: () => void;
  isDev: boolean;
  setDev: (isDev: boolean) => void;
  gameExpanded: string;
  setGameExpanded: (gameExpanded: string) => void;
  branch: string;
  setBranch: (branch: string) => void;
  selectedArguments: Record<string, string | null>;
  setSelectedArguments: (
    selectedArguments: Record<string, string | null>,
  ) => void;
  needPatching: boolean;
  setNeedPatching: (isPatching: boolean) => void;
  locked: boolean;
  setLocked: (locked: boolean) => void;
  setOldBranch: (branch: string) => void;
  oldBranch: string;
  nobranchDownload: boolean;
  setNoBranchDownload: (nodownload: boolean) => void;
  stats: string;
  setStats: (stats: string) => void;
  apiVersion: 'v1' | 'production';
  setApiVersion: (apiVersion: 'v1' | 'production') => void;
  followedPlayers: string[];
  setFollowedPlayers: (players: string[]) => Promise<void>;
  addFollowedPlayer: (player: string) => Promise<void>;
  removeFollowedPlayer: (player: string) => Promise<void>;
}

const EvosStore = create<EvosStoreState>((set, get) => ({
  isDev: false,
  stats: 'https://stats-production.evos.live/',
  colorPrimary: '#9cb8ba',
  colorSecondary: '#9cb8ba',
  colorBackground: '#000000fc',
  colorText: '#ffffff',
  colorScrollBar: '#6b6b6b',
  colorPaper: '#000000',
  mode: 'dark', // Default value while fetching from storage.
  ip: 'ar.zheneq.net',
  authenticatedUsers: [],
  activeUser: null,
  age: 0,
  exePath: '',
  folderPath: '',
  gamePort: '6050',
  ticketEnabled: 'false',
  isDownloading: false,
  noLogEnabled: 'false',
  showAllChat: 'true',
  discordId: 0,
  enableDiscordRPC: 'true',
  gameExpanded: 'true',
  branch: '',
  selectedArguments: {},
  needPatching: false,
  locked: false,
  oldBranch: '',
  nobranchDownload: false,
  apiVersion: 'production',
  followedPlayers: [],

  setStats: async (stats: string) => {
    set({ stats });
  },

  setColorPrimary: async (colorPrimary: string) => {
    withElectron((electron) => {
      electron.ipcRenderer.setTheme(
        get().mode !== 'dark' ? get().colorPrimary : get().colorPaper,
        get().colorText,
      );
    });
    set({ colorPrimary });
    try {
      await withElectron((electron) =>
        electron.store.setItem('colorPrimary', colorPrimary),
      );
    } catch (error) {
      console.error('Error while saving colorPrimary to storage:', error);
    }
  },

  setColorSecondary: async (colorSecondary: string) => {
    withElectron((electron) =>
      electron.ipcRenderer.setTheme(
        get().mode !== 'dark' ? get().colorPrimary : get().colorPaper,
        get().colorText,
      ),
    );
    set({ colorSecondary });
    try {
      await withElectron(
        (electron) => electron.store.setItem('colorSecondary', colorSecondary),
        Promise.resolve(),
      );
    } catch (error) {
      console.error('Error while saving colorSecondary to storage:', error);
    }
  },
  setColorBackground: async (colorBackground: string) => {
    set({ colorBackground });
    await get().setToStorage('colorBackground', colorBackground);
  },

  setColorText: async (colorText: string) => {
    withElectron((electron) =>
      electron.ipcRenderer.setTheme(
        get().mode !== 'dark' ? get().colorPrimary : get().colorPaper,
        get().colorText,
      ),
    );
    set({ colorText });
    await get().setToStorage('colorText', colorText);
  },

  setColorPaper: async (colorPaper: string) => {
    withElectron((electron) =>
      electron.ipcRenderer.setTheme(
        get().mode !== 'dark' ? get().colorPrimary : colorPaper,
        get().colorText,
      ),
    );
    set({ colorPaper });
    await get().setToStorage('colorPaper', colorPaper);
  },

  setColorScrollBar: async (colorScrollBar: string) => {
    withElectron((electron) =>
      electron.ipcRenderer.setTheme(
        get().mode !== 'dark' ? get().colorPrimary : get().colorPaper,
        get().colorText,
      ),
    );
    set({ colorScrollBar });
    await get().setToStorage('colorScrollBar', colorScrollBar);
  },
  setNoBranchDownload: (nobranchDownload: boolean) => {
    set({ nobranchDownload });
  },

  setOldBranch: (branch: string) => {
    set({ oldBranch: branch });
  },

  setLocked: (locked: boolean) => {
    set({ locked });
  },

  setNeedPatching: (isPatching: boolean) => {
    set({ needPatching: isPatching });
  },

  setDiscordId: (discord: number) => {
    set({ discordId: discord });
  },
  // Helper async function to fetch values from storage
  getFromStorage: async <T>(key: string): Promise<T | null> => {
    try {
      // Try Electron storage first, fallback to browser storage
      const value = await withElectron(
        (electron) => electron.store.getItem(key),
        browserStorage.getItem(key),
      );
      return value || null;
    } catch (error) {
      console.error(`Error while fetching ${key} from storage:`, error);
      return null;
    }
  },

  // Helper async function to set values in storage
  setToStorage: async (key: string, value: any): Promise<void> => {
    try {
      await withElectron(
        (electron) => electron.store.setItem(key, value),
        browserStorage.setItem(key, value),
      );
    } catch (error) {
      console.error(`Error while saving ${key} to storage:`, error);
    }
  },

  // Helper async function to remove values from storage
  removeFromStorage: async (key: string): Promise<void> => {
    try {
      await withElectron(
        (electron) => electron.store.removeItem(key),
        browserStorage.removeItem(key),
      );
    } catch (error) {
      console.error(`Error while removing ${key} from storage:`, error);
    }
  },

  // Helper function to clear all storage
  clearStorage: (): void => {
    try {
      withElectron(
        (electron) => electron.store.clear(),
        browserStorage.clear(),
      );
    } catch (error) {
      console.error('Error while clearing storage:', error);
    }
  },

  init: async () => {
    let ip = (await get().getFromStorage('ip')) as string;
    const [
      mode,
      authenticatedUsers,
      activeUser,
      exePath,
      folderPath,
      gamePort,
      ticketEnabled,
      noLogEnabled,
      showAllChat,
      enableDiscordRPC,
      gameExpanded,
      branch,
      selectedArguments,
      colorPrimary,
      colorSecondary,
      colorBackground,
      colorText,
      colorScrollBar,
      colorPaper,
      apiVersion,
      followedPlayers,
    ] = await Promise.all([
      get().getFromStorage('mode') as string,
      get().getFromStorage('authenticatedUsers') as AuthUser[],
      get().getFromStorage('activeUser') as AuthUser | null,
      get().getFromStorage('exePath') as string,
      get().getFromStorage('folderPath') as string,
      get().getFromStorage('gamePort') as string,
      get().getFromStorage('ticketEnabled') as string,
      get().getFromStorage('noLogEnabled') as string,
      get().getFromStorage('showAllChat') as string,
      get().getFromStorage('enableDiscordRPC') as string,
      get().getFromStorage('gameExpanded') as string,
      get().getFromStorage('branch') as string,
      get().getFromStorage('selectedArguments') as Record<
        string,
        string | null
      >,
      get().getFromStorage('colorPrimary') as string,
      get().getFromStorage('colorSecondary') as string,
      get().getFromStorage('colorBackground') as string,
      get().getFromStorage('colorText') as string,
      get().getFromStorage('colorScrollBar') as string,
      get().getFromStorage('colorPaper') as string,
      get().getFromStorage('apiVersion') as 'v1' | 'production',
      get().getFromStorage('followedPlayers') as string[],
    ]);

    let users: AuthUser[] = [];

    if (authenticatedUsers !== null && authenticatedUsers.length !== 0) {
      users = JSON.parse(authenticatedUsers.toString());
    }

    // Compatibility with old config files change ip to new values
    if (ip === 'arproxy.addalyn.baby') {
      ip = 'de.evos.live';
      get().setIp(ip);
    }
    if (ip === 'arproxy2.addalyn.baby') {
      ip = 'fr.evos.live';
      get().setIp(ip);
    }
    if (ip === 'arproxy3.addalyn.baby') {
      ip = 'fi.evos.live';
      get().setIp(ip);
    }
    // Expired domain
    if (ip === 'evos-emu.com') {
      ip = 'ar.zheneq.net';
      get().setIp(ip);
    }

    set({
      mode: mode !== 'dark' && mode !== 'light' ? 'dark' : mode,
      ip: ip || '',
      authenticatedUsers: users || [],
      activeUser: activeUser || null,
      exePath: exePath || '',
      folderPath: folderPath || '',
      gamePort: gamePort || '6050',
      ticketEnabled: ticketEnabled || 'true',
      noLogEnabled: noLogEnabled || 'false',
      showAllChat: showAllChat || 'true',
      enableDiscordRPC: enableDiscordRPC || 'true',
      gameExpanded: gameExpanded || 'true',
      branch: branch || 'Original',
      selectedArguments: selectedArguments || {},
      colorPrimary: colorPrimary || '#9cb8ba',
      colorSecondary: colorSecondary || '#0000',
      colorBackground: colorBackground || '#000000fc',
      colorText: colorText || '#ffffff',
      colorScrollBar: colorScrollBar || '#6b6b6b',
      colorPaper: colorPaper || '#0000',
      apiVersion: apiVersion || 'production',
      followedPlayers: followedPlayers || [],
    });
    withElectron((electron) =>
      electron.ipcRenderer.setTheme(
        get().mode !== 'dark' ? get().colorPrimary : get().colorPaper,
        get().colorText,
      ),
    );
    get().switchUser(activeUser?.user || users[0]?.user || '');
  },

  setDev: (isDev: boolean) => {
    set({ isDev });
  },

  setShowAllChat: async (showAllChat: string) => {
    set({ showAllChat });
    await get().setToStorage('showAllChat', showAllChat);
  },

  toggleMode: async () => {
    const newMode = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode: newMode });
    if (newMode === 'light') {
      set({ colorPrimary: '#0029ff' });
      set({ colorSecondary: '#ffffff' });
      set({ colorBackground: '#fffffffc' });
      set({ colorText: '#000000fc' });
      set({ colorScrollBar: '#0029ff' });
      set({ colorPaper: '#ffffff' });
    } else {
      set({ colorPrimary: '#9cb8ba' });
      set({ colorSecondary: '#9cb8ba' });
      set({ colorBackground: '#000000fc' });
      set({ colorText: '#ffffff' });
      set({ colorScrollBar: '#6b6b6b' });
      set({ colorPaper: '#000000' });
    }

    try {
      withElectron((electron) =>
        electron.ipcRenderer.setTheme(
          newMode === 'dark' ? '#0000' : '#0029ff',
          newMode !== 'dark' ? '#000000fc' : '#ffffff',
        ),
      );
      await get().setToStorage('mode', newMode);
      await get().setToStorage('colorPrimary', get().colorPrimary);
      await get().setToStorage('colorSecondary', get().colorSecondary);
      await get().setToStorage('colorBackground', get().colorBackground);
      await get().setToStorage('colorText', get().colorText);
      await get().setToStorage('colorScrollBar', get().colorScrollBar);
      await get().setToStorage('colorPaper', get().colorPaper);
    } catch (error) {
      console.error('Error while saving mode to storage:', error);
    }
  },

  toggleDiscordRPC: async () => {
    const newMode = get().enableDiscordRPC === 'true' ? 'false' : 'true';
    set({ enableDiscordRPC: newMode });
    await get().setToStorage('enableDiscordRPC', newMode);
  },

  setIp: async (ip: string) => {
    set({ ip });

    trackEvent('Game Ip Changed', {
      ip,
    });

    await get().setToStorage('ip', ip);
  },

  setIsDownloading: async (isDownloading: boolean) => {
    set({ isDownloading });
  },

  setExePath: async (exePath: string) => {
    set({ exePath });
    await get().setToStorage('exePath', exePath);
  },

  setFolderPath: async (folderPath: string) => {
    set({ folderPath });
    await get().setToStorage('folderPath', folderPath);
  },

  setTicketEnabled: async (ticketEnabled: string) => {
    set({ ticketEnabled });
    await get().setToStorage('ticketEnabled', ticketEnabled);
  },

  setNoLogEnabled: async (noLogEnabled: string) => {
    set({ noLogEnabled });
    await get().setToStorage('noLogEnabled', noLogEnabled);
  },

  setGamePort: async (gamePort: string) => {
    set({ gamePort });
    await get().setToStorage('gamePort', gamePort);
  },

  setAuthenticatedUsers: async (
    user: string,
    token: string,
    handle: string,
    banner: number,
  ) => {
    const currentAuthenticatedUsers = get().authenticatedUsers;
    const updatedAuthenticatedUsers = [
      ...currentAuthenticatedUsers,
      { user, token, handle, banner },
    ];
    set({ authenticatedUsers: updatedAuthenticatedUsers });
    await get().setToStorage(
      'authenticatedUsers',
      JSON.stringify(updatedAuthenticatedUsers),
    );
  },

  updateAuthenticatedUsers: async (
    user: string,
    token: string,
    handle: string,
    banner: number,
    configFile?: string,
  ) => {
    const currentAuthenticatedUsers = get().authenticatedUsers;
    if (currentAuthenticatedUsers !== null) {
      const updatedAuthenticatedUsers = currentAuthenticatedUsers.map(
        (authUser: AuthUser) => {
          if (authUser.user === user) {
            return { user, token, handle, banner, configFile } as AuthUser;
          }
          return authUser as AuthUser;
        },
      );
      set({ authenticatedUsers: updatedAuthenticatedUsers });
      await get().setToStorage(
        'authenticatedUsers',
        JSON.stringify(updatedAuthenticatedUsers),
      );
    }

    // update user
    get().switchUser(user);
  },

  switchUser: async (user: string) => {
    if (user !== undefined && user === '') {
      await get().removeFromStorage('activeUser');
    }
    const currentAuthenticatedUsers = get().authenticatedUsers;

    if (
      currentAuthenticatedUsers !== null &&
      currentAuthenticatedUsers.length !== 0
    ) {
      const selectedUser = currentAuthenticatedUsers.find(
        (authUser) =>
          authUser.user === user || authUser.user === user.toLowerCase(), // Comaptibility with old config files
      );

      if (selectedUser) {
        set({ activeUser: selectedUser });
        await get().setToStorage('activeUser', selectedUser);
      }
    }
  },

  setGameExpanded: async (gameExpanded: string) => {
    set({ gameExpanded });
    await get().setToStorage('gameExpanded', gameExpanded);
  },

  setBranch: async (branch: string) => {
    set({ branch });
    await get().setToStorage('branch', branch);
  },

  setSelectedArguments: async (
    selectedArguments: Record<string, string | null>,
  ) => {
    set({ selectedArguments });
    await get().setToStorage('selectedArguments', selectedArguments);
  },

  setApiVersion: async (apiVersion: 'v1' | 'production') => {
    set({ apiVersion });
    await get().setToStorage('apiVersion', apiVersion);
  },

  setFollowedPlayers: async (players: string[]) => {
    set({ followedPlayers: players });
    await get().setToStorage('followedPlayers', players);
  },
  addFollowedPlayer: async (player: string) => {
    const currentPlayers = get().followedPlayers;
    if (!currentPlayers.includes(player)) {
      const updatedPlayers = [...currentPlayers, player];
      set({ followedPlayers: updatedPlayers });
      await get().setToStorage('followedPlayers', updatedPlayers);
    }
  },
  removeFollowedPlayer: async (player: string) => {
    const currentPlayers = get().followedPlayers;
    const updatedPlayers = currentPlayers.filter((p) => p !== player);
    set({ followedPlayers: updatedPlayers });
    await get().setToStorage('followedPlayers', updatedPlayers);
  },
}));

// Call the init function to fetch and set the values from storage.
EvosStore.getState().init();

export default EvosStore;
