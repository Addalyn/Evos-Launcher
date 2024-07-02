import { create } from 'zustand';
/* eslint-disable no-console */
import { trackEvent } from '@aptabase/electron/renderer';

export interface AuthUser {
  user: string;
  token: string;
  handle: string;
  banner: number;
  configFile?: string;
}

export interface EvosStoreState {
  getFromStorage(arg0: string): any;
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
  setShowAllChat: (showAllChat: string) => void;
  setIsDownloading: (isDownloading: boolean) => void;
  init: () => void;
  toggleMode: () => void;
  setIp: (ip: string) => void;
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
  enablePatching: string;
  setEnablePatching: (enablePatching: string) => void;
  setDiscordId: (discord: number) => void;
  discordId: number;
  enableDiscordRPC: string;
  toggleDiscordRPC: () => void;
  isDev: boolean;
  setDev: (isDev: boolean) => void;
}

const EvosStore = create<EvosStoreState>((set, get) => ({
  isDev: false,
  mode: 'dark', // Default value while fetching from storage.
  ip: '',
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
  enablePatching: 'true',
  discordId: 0,
  enableDiscordRPC: 'true',
  setDiscordId: (discord: number) => {
    set({ discordId: discord });
  },
  // Helper async function to fetch values from storage
  getFromStorage: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await window.electron.store.getItem(key);
      return value || null;
    } catch (error) {
      console.error(`Error while fetching ${key} from storage:`, error);
      return null;
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
      // enablePatching,
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
      // get().getFromStorage('enablePatching') as string,
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
      enablePatching: 'true', // enablePatching || 'true',
      enableDiscordRPC: enableDiscordRPC || 'true',
    });
    window.electron.ipcRenderer.setTheme(
      mode !== 'dark' && mode !== 'light' ? 'dark' : mode,
    );
    get().switchUser(activeUser?.user || users[0]?.user || '');
  },

  setDev: (isDev: boolean) => {
    set({ isDev });
  },

  setShowAllChat: (showAllChat: string) => {
    set({ showAllChat });

    try {
      window.electron.store.setItem('showAllChat', showAllChat);
    } catch (error) {
      console.error('Error while saving showAllChat to storage:', error);
    }
  },

  toggleMode: async () => {
    const newMode = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode: newMode });

    try {
      window.electron.ipcRenderer.setTheme(newMode);
      await window.electron.store.setItem('mode', newMode);
    } catch (error) {
      console.error('Error while saving mode to storage:', error);
    }
  },

  toggleDiscordRPC: async () => {
    const newMode = get().enableDiscordRPC === 'true' ? 'false' : 'true';
    set({ enableDiscordRPC: newMode });

    try {
      await window.electron.store.setItem('enableDiscordRPC', newMode);
    } catch (error) {
      console.error('Error while saving enableDiscordRPC to storage:', error);
    }
  },

  setIp: async (ip: string) => {
    set({ ip });

    trackEvent('Game Ip Changed', {
      ip,
    });

    try {
      await window.electron.store.setItem('ip', ip);
    } catch (error) {
      console.error('Error while saving ip to storage:', error);
    }
  },

  setIsDownloading: async (isDownloading: boolean) => {
    set({ isDownloading });
  },

  setExePath: async (exePath: string) => {
    set({ exePath });

    try {
      await window.electron.store.setItem('exePath', exePath);
    } catch (error) {
      console.error('Error while saving exePath to storage:', error);
    }
  },

  setFolderPath: async (folderPath: string) => {
    set({ folderPath });

    try {
      await window.electron.store.setItem('folderPath', folderPath);
    } catch (error) {
      console.error('Error while saving folderPath to storage:', error);
    }
  },

  setTicketEnabled: async (ticketEnabled: string) => {
    set({ ticketEnabled });

    try {
      await window.electron.store.setItem('ticketEnabled', ticketEnabled);
    } catch (error) {
      console.error('Error while saving ticketEnabled to storage:', error);
    }
  },

  setNoLogEnabled: async (noLogEnabled) => {
    set({ noLogEnabled });
    try {
      await window.electron.store.setItem('noLogEnabled', noLogEnabled);
    } catch (error) {
      console.error('Error while saving noLogEnabled to storage:', error);
    }
  },

  setGamePort: async (gamePort: string) => {
    set({ gamePort });

    try {
      await window.electron.store.setItem('gamePort', gamePort);
    } catch (error) {
      console.error('Error while saving gamePort to storage:', error);
    }
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

    try {
      await window.electron.store.setItem(
        'authenticatedUsers',
        JSON.stringify(updatedAuthenticatedUsers),
      );
    } catch (error) {
      console.error('Error while saving authenticatedUsers to storage:', error);
    }
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

      try {
        await window.electron.store.setItem(
          'authenticatedUsers',
          JSON.stringify(updatedAuthenticatedUsers),
        );
      } catch (error) {
        console.error(
          'Error while saving authenticatedUsers to storage:',
          error,
        );
      }
    }

    // update user
    get().switchUser(user);
  },

  switchUser: async (user: string) => {
    if (user !== undefined && user === '') {
      await window.electron.store.removeItem('activeUser');
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

        try {
          await window.electron.store.setItem('activeUser', selectedUser);
        } catch (error) {
          console.error('Error while saving activeUser to storage:', error);
        }
      }
    }
  },

  setEnablePatching: async (enablePatching: string) => {
    set({ enablePatching });

    try {
      await window.electron.store.setItem('enablePatching', enablePatching);
    } catch (error) {
      console.error('Error while saving enablePatching to storage:', error);
    }
  },
}));

// Call the init function to fetch and set the values from storage.
EvosStore.getState().init();

export default EvosStore;
