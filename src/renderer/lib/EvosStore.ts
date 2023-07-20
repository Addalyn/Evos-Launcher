import { create } from 'zustand';

interface EvosStoreState {
  mode: string;
  toggleMode: () => void;
  ip: string;
  setIp: (ip: string) => void;
  userName: string;
  setUserName: (userName: string) => void;
  age: number;
  setAge: (status: number) => void;
  exePath: string;
  setExePath: (exePath: string) => void;
  gamePort: string;
  setGamePort: (gamePort: string) => void;
  experimental: string;
  setExperimental: (experimental: string) => void;
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
  userName: localStorage.getItem('userName') || '',
  setUserName: (userName: string) => {
    localStorage.setItem('userName', userName);
    set({ userName });
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
