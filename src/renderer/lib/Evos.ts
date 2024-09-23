import axios from 'axios';
import { strapiClient } from './strapi';

export interface LoginResponse {
  handle: string;
  token: string;
  banner: number;
}
export const denydNames = [
  'Bot',
  /* Firepower */
  'Blackburn',
  'Celeste',
  'Elle',
  'Gremolitions Inc.',
  'Grey',
  'Juno',
  'Kaigin',
  'Lex',
  'Lockwood',
  'NEV:3',
  'Nix',
  'OZ',
  'Oz',
  'PuP',
  'Tol-Ren',
  'Vonn',
  'Zuki',
  /* Frontline */
  'Asana',
  'Brynn',
  'Garrison',
  'Isadora',
  'Magnus',
  'Phaedra',
  'Rampart',
  'Rask',
  'Titus',
  /* Support */
  'Aurora',
  'Dr. Finn',
  'Helio',
  'Khita',
  'Meridian',
  'Orion',
  'Quark',
  'Su-Ren',
];

export enum CharacterType {
  None = 'None',
  BattleMonk = 'BattleMonk',
  BazookaGirl = 'BazookaGirl',
  DigitalSorceress = 'DigitalSorceress',
  Gremlins = 'Gremlins',
  NanoSmith = 'NanoSmith',
  RageBeast = 'RageBeast',
  RobotAnimal = 'RobotAnimal',
  Scoundrel = 'Scoundrel',
  Sniper = 'Sniper',
  SpaceMarine = 'SpaceMarine',
  Spark = 'Spark',
  TeleportingNinja = 'TeleportingNinja',
  Thief = 'Thief',
  Tracker = 'Tracker',
  Trickster = 'Trickster',
  PunchingDummy = 'PunchingDummy',
  Rampart = 'Rampart',
  Claymore = 'Claymore',
  Blaster = 'Blaster',
  FishMan = 'FishMan',
  Exo = 'Exo',
  Soldier = 'Soldier',
  Martyr = 'Martyr',
  Sensei = 'Sensei',
  PendingWillFill = 'PendingWillFill',
  Manta = 'Manta',
  Valkyrie = 'Valkyrie',
  Archer = 'Archer',
  TestFreelancer1 = 'TestFreelancer1',
  TestFreelancer2 = 'TestFreelancer2',
  Samurai = 'Samurai',
  Gryd = 'Gryd',
  Cleric = 'Cleric',
  Neko = 'Neko',
  Scamp = 'Scamp',
  FemaleWillFill = 'FemaleWillFill',
  Dino = 'Dino',
  Iceborg = 'Iceborg',
  Fireborg = 'Fireborg',
  Last = 'Last',
}

export enum MapType {
  CargoShip_Deathmatch = 'Flyway Freighter',
  Casino01_Deathmatch = 'Hexcelence',
  EvosLab_Deathmatch = 'EvoS Labs',
  Oblivion_Deathmatch = 'Oblivion',
  Reactor_Deathmatch = 'Omni Reactor Core',
  RobotFactory_Deathmatch = 'Hyperforge',
  Skyway_Deathmatch = 'Cloudspire',
  SkywaySnow_Deathmatch = 'Christmas Cloudspire',
  Unknown_Map = 'Unknown Map',
}

export interface factionData {
  factions: number[];
  selectedRibbonID: number;
}

export interface PlayerData {
  accountId: number;
  handle: string;
  bannerBg: number;
  bannerFg: number;
  titleId: number;
  status: string;
  factionData?: factionData;
  isDev: boolean;
}

export interface AccountData extends PlayerData {
  locked: boolean;
  lockedUntil: string;
  lockedReason: string;
  adminMessage: string;
}

export interface GroupData {
  groupId: number;
  accountIds: number[];
}

export interface QueueData {
  type: string;
  groupIds: number[];
}

export interface ServerData {
  id: string;
  name: string;
}

export interface GamePlayerData {
  accountId: number;
  characterType: CharacterType;
}

export interface GameData {
  id: string;
  ts: string;
  server: string;
  teamA: GamePlayerData[];
  teamB: GamePlayerData[];
  map: MapType;
  status: string;
  turn: number;
  teamAScore: number;
  teamBScore: number;
  gameType: string;
}

export interface DataItem {
  total: string;
  user: string;
}

export interface Status {
  players: PlayerData[];
  groups: GroupData[];
  queues: QueueData[];
  servers: ServerData[];
  games: GameData[];
  factionsData: number[];
  factionsEnabled: boolean;
  error?: string;
}

export interface TextNotification {
  text: string;
  severity: string;
}

export interface TextMotd {
  text: string;
  severity: string;
}

export interface TrustWar {
  factions: number[];
  selectedRibbonID?: number;
}

export interface Argument {
  key: string;
  value: string[];
  description: string;
  defaultValue: string;
  showOnlyDev?: boolean;
}

export interface Branch {
  path: string;
  text: string;
  version: string;
  enabled: boolean;
  devOnly: boolean;
  disabled: boolean;
  recommended: boolean;
  removed: boolean;
  files: {
    path: string;
    checksum: string;
  }[];
  arguments?: Argument[];
}

export interface Branches {
  [key: string]: Branch;
}

export function asDate(date?: string): Date | undefined {
  return date ? new Date(date) : undefined;
}

export function cap(txt: string): string {
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

export const WS_URL = `wss://launcher.evos.live/websocket`;

export async function login(
  abort: AbortController,
  username: string,
  password: string,
) {
  const ip = await window.electron.store.getItem('ip');
  const baseUrl = `https://${ip}`;

  return axios.post<LoginResponse>(
    `${baseUrl}/api/login`,
    { UserName: username, Password: password },
    { signal: abort.signal },
  );
}

export async function registerAccount(
  abort: AbortController,
  username: string,
  password: string,
  code: string,
) {
  const ip = await window.electron.store.getItem('ip');
  const baseUrl = `https://${ip}`;

  return axios.post<LoginResponse>(
    `${baseUrl}/api/register`,
    { UserName: username, Password: password, Code: code },
    { signal: abort.signal },
  );
}

export async function logout(authHeader: string) {
  const ip = await window.electron.store.getItem('ip');
  const baseUrl = `https://${ip}`;
  return axios.get<Status>(`${baseUrl}/api/logout`, {
    headers: { Authorization: `bearer ${authHeader}` },
  });
}

export async function changePassword(authHeader: string, password: string) {
  const ip = await window.electron.store.getItem('ip');
  const baseUrl = `https://${ip}`;
  return axios.put(
    `${baseUrl}/api/account/changePassword`,
    {
      Password: password,
    },
    {
      headers: { Authorization: `bearer ${authHeader}` },
    },
  );
}

export async function getStatus() {
  const ip = await window.electron.store.getItem('ip');
  const baseUrl = `https://${ip}`;
  return axios.get<Status>(`${baseUrl}/api/lobby/status`);
}

export async function getMotd(language: string) {
  const ip = await window.electron.store.getItem('ip');
  const baseUrl = `https://${ip}`;

  try {
    return await axios.get<TextMotd>(
      `${baseUrl}/api/lobby/motd/LauncherMessageOfTheDay/${language}`,
    );
  } catch (e) {
    return axios.get<TextMotd>(
      `${baseUrl}/api/lobby/motd/LauncherMessageOfTheDay/en`,
    );
  }
}

export async function getNotification(language: string) {
  const ip = await window.electron.store.getItem('ip');
  const baseUrl = `https://${ip}`;
  try {
    return await axios.get<TextNotification>(
      `${baseUrl}/api/lobby/motd/LauncherNotification/${language}?rand=${Math.random()}`,
    );
  } catch (e) {
    return axios.get<TextNotification>(
      `${baseUrl}/api/lobby/motd/LauncherNotification/en?rand=${Math.random()}`,
    );
  }
}

export async function getTicket(authHeader: string) {
  const ip = await window.electron.store.getItem('ip');
  const baseUrl = `https://${ip}`;
  return axios.get<Status>(`${baseUrl}/api/ticket`, {
    headers: { Authorization: `bearer ${authHeader}` },
  });
}

export async function getPlayerData(authHeader: string, queryParams: string) {
  const ip = await window.electron.store.getItem('ip');
  const baseUrl = `https://${ip}`;
  return axios.get<PlayerData>(
    `${baseUrl}/api/lobby/playerInfo?handle=${queryParams}`,
    {
      headers: { Authorization: `bearer ${authHeader}` },
    },
  );
}

// export async function fetchGameInfo(action: string) {
//   try {
//     const strapi = strapiClient.from(`stats/${action}`).select();

//     const { data, error } = await strapi.get();

//     if (error) {
//       return [] as DataItem[];
//     }
//     return data as DataItem[];
//   } catch (error) {
//     return [] as DataItem[];
//   }
// }

export async function fetchGameInfo(action: string, signal?: AbortSignal) {
  const url = `https://stats-production.evos.live/api/stats/${action}`;

  try {
    const response = await axios.get(url, { signal });
    return response.data.data as DataItem[];
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
      return [] as DataItem[];
    }
    return [] as DataItem[];
  }
}

export async function getPlayerInfo(authHeader: string) {
  if (authHeader === '') return null;
  const ip = await window.electron.store.getItem('ip');
  const baseUrl = `https://${ip}`;
  return axios.get<AccountData>(`${baseUrl}/api/account/me`, {
    headers: { Authorization: `bearer ${authHeader}` },
  });
}

interface BannersQuery {
  id: number;
  handle: string;
  banner: string;
}

interface SpecialNames {
  TournamentWinners: string[];
  Developers: string[];
  MVP: string[];
  Nitro: string[];
  Special: string[];
  Mentor: string[];
}

interface SpecialNamesQuery {
  id: number;
  effectname: string;
  playername: string;
}

async function convertSpecialNamesQueryToSpecialNames(
  data: SpecialNamesQuery[],
): Promise<SpecialNames> {
  const specialNames: SpecialNames = {
    TournamentWinners: [],
    Developers: [],
    MVP: [],
    Nitro: [],
    Special: [],
    Mentor: [],
  };

  data.forEach((item) => {
    switch (item.effectname) {
      case 'TournamentWinners':
        specialNames.TournamentWinners.push(item.playername);
        break;
      case 'Developers':
        specialNames.Developers.push(item.playername);
        break;
      case 'MVP':
        specialNames.MVP.push(item.playername);
        break;
      case 'Nitro':
        specialNames.Nitro.push(item.playername);
        break;
      case 'Special':
        specialNames.Special.push(item.playername);
        break;
      case 'Mentor':
        specialNames.Mentor.push(item.playername);
        break;
      default:
        // Ignore unknown effect names
        break;
    }
  });

  return specialNames;
}

// cache this data for 1 minute, was doing way to mutch requests to the api
const cacheTimeout = 1 * 60 * 1000;
let cache: { data: SpecialNames | null; timestamp: number } | null = null;
let isFetching = false;
let fetchPromise: Promise<SpecialNames | null> | null = null;
let cacheBanner: { data: BannersQuery[] | null; timestamp: number } | null =
  null;
let isFetchingBanner = false;
let fetchPromiseBanner: Promise<BannersQuery[] | null> | null = null;

export async function getSpecialNames(): Promise<SpecialNames | null> {
  try {
    const currentTime = Date.now();

    // Check if cache exists and is still valid
    if (cache && currentTime - cache.timestamp < cacheTimeout) {
      return cache.data;
    }

    // If a fetch is already in progress, wait for it to complete
    if (isFetching && fetchPromise) {
      return await fetchPromise;
    }

    // Set fetching state and create a fetch promise
    isFetching = true;
    fetchPromise = (async () => {
      try {
        const strapi = strapiClient
          .from<SpecialNamesQuery>(`specialeffects`)
          .select();

        const { data, error } = await strapi.get();

        if (error) {
          return null as unknown as SpecialNames;
        }
        if (data && data.length > 0) {
          const specialNames: SpecialNames =
            await convertSpecialNamesQueryToSpecialNames(data);

          // Update cache
          cache = {
            data: specialNames,
            timestamp: currentTime,
          };
          return specialNames;
        }
        return null as unknown as SpecialNames;
      } catch (error) {
        return null as unknown as SpecialNames;
      } finally {
        isFetching = false;
        fetchPromise = null;
      }
    })();

    return await fetchPromise;
  } catch (error) {
    isFetching = false;
    fetchPromise = null;
    return null as unknown as SpecialNames;
  }
}

export async function getBanners(): Promise<BannersQuery[] | null> {
  try {
    const currentTime = Date.now();

    // Check if cache exists and is still valid
    if (cacheBanner && currentTime - cacheBanner.timestamp < cacheTimeout) {
      return cacheBanner.data;
    }

    // If a fetch is already in progress, wait for it to complete
    if (isFetchingBanner && fetchPromiseBanner) {
      return await fetchPromiseBanner;
    }

    // Set fetching state and create a fetch promise
    isFetchingBanner = true;
    fetchPromiseBanner = (async () => {
      try {
        // Fetch data from the Strapi client
        const strapi = strapiClient.from<BannersQuery>('banners').select();
        const { data, error } = await strapi.get();

        // Handle errors and empty data
        if (error || !data || data.length === 0) {
          return null;
        }

        // Update cache with all data
        cacheBanner = {
          data,
          timestamp: currentTime,
        };

        return data;
      } catch (fetchError) {
        return null;
      } finally {
        // Reset fetching state
        isFetchingBanner = false;
        fetchPromiseBanner = null;
      }
    })();

    return await fetchPromiseBanner;
  } catch (outerError) {
    // Reset fetching state on error
    isFetchingBanner = false;
    fetchPromiseBanner = null;
    return null;
  }
}

export async function getUpdateInfo() {
  return axios.get(`https://misc.evos.live/version.json?rand=${Math.random()}`);
}

export async function getBranches() {
  const baseUrl = `https://builds.evos.live/builds.json`;
  return axios.get<Branches>(baseUrl);
}
