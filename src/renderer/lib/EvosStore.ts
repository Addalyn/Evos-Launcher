/* eslint-disable no-console */
import { trackEvent } from '@aptabase/electron/renderer';
import { create } from 'zustand';

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
  setAge: (age: number) => void;
  enablePatching: string;
  setEnablePatching: (enablePatching: string) => void;
}

const EvosStore = create<EvosStoreState>((set, get) => ({
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
      age,
      exePath,
      folderPath,
      gamePort,
      ticketEnabled,
      noLogEnabled,
      showAllChat,
      // enablePatching,
    ] = await Promise.all([
      get().getFromStorage('mode') as string,
      get().getFromStorage('authenticatedUsers') as AuthUser[],
      get().getFromStorage('activeUser') as AuthUser | null,
      get().getFromStorage('age') as number,
      get().getFromStorage('exePath') as string,
      get().getFromStorage('folderPath') as string,
      get().getFromStorage('gamePort') as string,
      get().getFromStorage('ticketEnabled') as string,
      get().getFromStorage('noLogEnabled') as string,
      get().getFromStorage('showAllChat') as string,
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
      mode: mode || 'dark',
      ip: ip || '',
      authenticatedUsers: users || [],
      activeUser: activeUser || null,
      age: age || 0,
      exePath: exePath || '',
      folderPath: folderPath || '',
      gamePort: gamePort || '6050',
      ticketEnabled: ticketEnabled || 'true',
      noLogEnabled: noLogEnabled || 'false',
      showAllChat: showAllChat || 'true',
      enablePatching: 'true', // enablePatching || 'true',
    });

    get().switchUser(activeUser?.user || users[0]?.user || '');
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
      await window.electron.store.setItem('mode', newMode);
    } catch (error) {
      console.error('Error while saving mode to storage:', error);
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

  setAge: (age: number) => {
    set({ age });
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
