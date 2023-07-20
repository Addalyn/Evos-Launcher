import axios from 'axios';

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
  Unknown_Map = 'Unknown Map',
}

export interface PlayerData {
  accountId: number;
  handle: string;
  bannerBg: number;
  bannerFg: number;
  status: string;
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

export interface Status {
  players: PlayerData[];
  groups: GroupData[];
  queues: QueueData[];
  servers: ServerData[];
  games: GameData[];
}

export function asDate(date?: string): Date | undefined {
  return date ? new Date(date) : undefined;
}

export function cap(txt: string): string {
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

export function login(
  abort: AbortController,
  username: string,
  password: string
) {
  const baseUrl = `https://${localStorage.getItem('ip')}`;

  return axios.post<LoginResponse>(
    `${baseUrl}/api/login`,
    { UserName: username, Password: password },
    { signal: abort.signal }
  );
}

export function getStatus(authHeader: string) {
  const baseUrl = `https://${localStorage.getItem('ip')}`;
  return axios.get<Status>(`${baseUrl}/api/lobby/status`, {
    headers: { Authorization: `bearer ${authHeader}` },
  });
}
