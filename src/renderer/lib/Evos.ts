import axios from 'axios';
import { strapiClient } from './strapi';

export interface LoginResponse {
  handle: string;
  token: string;
  banner: number;
}

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

export function asDate(date?: string): Date | undefined {
  return date ? new Date(date) : undefined;
}

export function cap(txt: string): string {
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

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

export async function fetchGameInfo(action: string) {
  try {
    const strapi = strapiClient.from(`stats/${action}`).select();

    const { data, error } = await strapi.get();

    if (error) {
      return [] as DataItem[];
    }
    return data as DataItem[];
  } catch (error) {
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

interface SpecialNames {
  TournamentWinners: string[];
  Developers: string[];
  MVP: string[];
  Nitro: string[];
}

export async function getSpecialNames() {
  return axios.get<SpecialNames>(
    `https://misc.evos.live/specialNames.json?rand=${Math.random()}`,
  );
}

export async function getUpdateInfo() {
  return axios.get(`https://misc.evos.live/version.json?rand=${Math.random()}`);
}
