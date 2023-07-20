import { create } from 'zustand';

export type AuthenticatedUser = {
  user: string;
  token: string;
  handle: string;
  banner: number;
  configFile?: string;
};

export interface EvosStoreState {
  mode: string;
  toggleMode: () => void;
  ip: string;
  setIp: (ip: string) => void;
  authenticatedUsers: {
    user: string;
    token: string;
    handle: string;
    banner: number;
    configFile?: string;
  }[];
  setAuthenticatedUsers: (
    user: string,
    token: string,
    handle: string,
    banner: number
  ) => void;
  updateAuthenticatedUsers: (
    user: string,
    token: string,
    handle: string,
    banner: number,
    configFile?: string
  ) => void;
  activeUser: AuthenticatedUser | null;
  switchUser: (user: string) => void;
  age: number;
  setAge: (status: number) => void;
  exePath: string;
  setExePath: (exePath: string) => void;
  gamePort: string;
  setGamePort: (gamePort: string) => void;
  experimental: string;
  setExperimental: (experimental: string) => void;
  logoutUser: (user: string) => void;
}

const EvosStore = create<EvosStoreState>((set, get) => ({
  mode: localStorage.getItem('mode') || 'dark',
  toggleMode: () => {
    localStorage.setItem('mode', get().mode === 'dark' ? 'light' : 'dark');
    set((state) => ({
      mode: state.mode === 'dark' ? 'light' : 'dark',
    }));
  },
  ip: localStorage.getItem('ip') || '',
  setIp: (ip: string) => {
    localStorage.setItem('ip', ip);
    set({ ip });
  },
  authenticatedUsers:
    JSON.parse(localStorage.getItem('authenticatedUsers') as string) || [],
  setAuthenticatedUsers: (user, token, handle, banner) => {
    const currentAuthenticatedUsers = get().authenticatedUsers;
    const updatedAuthenticatedUsers = [
      ...currentAuthenticatedUsers,
      { user, token, handle, banner },
    ];
    localStorage.setItem(
      'authenticatedUsers',
      JSON.stringify(updatedAuthenticatedUsers)
    );
    set({ authenticatedUsers: updatedAuthenticatedUsers });
  },
  updateAuthenticatedUsers: (user, token, handle, banner, configFile) => {
    const currentAuthenticatedUsers = get().authenticatedUsers;
    const updatedAuthenticatedUsers = currentAuthenticatedUsers.map(
      (authUser) => {
        if (authUser.user === user) {
          return { user, token, handle, banner, configFile };
        }
        return authUser;
      }
    );
    localStorage.setItem(
      'authenticatedUsers',
      JSON.stringify(updatedAuthenticatedUsers)
    );
    set({ authenticatedUsers: updatedAuthenticatedUsers });
    // update user
    get().switchUser(user);
  },
  logoutUser: (user) => {
    const currentAuthenticatedUsers = get().authenticatedUsers;
    const updatedAuthenticatedUsers = currentAuthenticatedUsers.filter(
      (authUser) => authUser.user !== user
    );
    localStorage.setItem(
      'authenticatedUsers',
      JSON.stringify(updatedAuthenticatedUsers)
    );
    set({ authenticatedUsers: updatedAuthenticatedUsers });
  },
  activeUser: JSON.parse(localStorage.getItem('activeUser') as string) || null,
  switchUser: (user) => {
    if (user === '') {
      localStorage.removeItem('activeUser');
      set({ activeUser: null });
      return;
    }
    const currentAuthenticatedUsers = get().authenticatedUsers;
    const selectedUser = currentAuthenticatedUsers.find(
      (authUser) => authUser.user === user
    );
    if (selectedUser) {
      localStorage.setItem('activeUser', JSON.stringify(selectedUser));
      set({ activeUser: selectedUser });
    }
  },
  age: 0,
  setAge: (age: number) => {
    set({ age });
  },
  exePath: localStorage.getItem('exePath') || '',
  setExePath: (exePath: string) => {
    localStorage.setItem('exePath', exePath);
    set({ exePath });
  },
  gamePort: localStorage.getItem('gamePort') || '6050',
  setGamePort: (gamePort: string) => {
    localStorage.setItem('gamePort', gamePort);
    set({ gamePort });
  },
  experimental: localStorage.getItem('experimental') || 'false',
  setExperimental: (experimental: string) => {
    localStorage.setItem('experimental', experimental.toString());
    set({ experimental });
  },
}));

export default EvosStore;
