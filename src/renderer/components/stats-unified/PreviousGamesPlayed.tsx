import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { GiBroadsword, GiDeathSkull, GiHealthNormal } from 'react-icons/gi';
import { PiSwordDuotone, PiSwordFill } from 'react-icons/pi';
import { PlayerData, denydNames } from 'renderer/lib/Evos';
/* eslint-disable react/no-danger */
/* eslint-disable react/require-default-props */
import React, { useCallback, useEffect, useState } from 'react';
// eslint-disable-next-line import/no-cycle
import { ReplayDialog, ReplayFile } from '../pages/ReplaysPage';
import { ability, abilityIcon, catalystsIcon } from 'renderer/lib/Resources';
import { strapiClient, strapiClientv1 } from 'renderer/lib/strapi';

import AdvancedDialog from '../pages/AdvancedPage';
import { BsShield } from 'react-icons/bs';
import { Close } from '@mui/icons-material';
import EvosStore from 'renderer/lib/EvosStore';
import { FaRankingStar } from 'react-icons/fa6';
import Player from '../atlas/Player';
import { trackEvent } from '@aptabase/electron/renderer';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface CharacterSkin {
  skinIndex: number;
  patternIndex: number;
  colorIndex: number;
}

interface Uploads {
  name: string;
  url: string;
}

interface CharacterInfo {
  CharacterType: number;
  CharacterSkin: CharacterSkin;
  CharacterCards: {
    CombatCard: Number;
    DashCard: Number;
    PrepCard: Number;
  };
  CharacterMods: Record<string, number>;
  CharacterAbilityVfxSwaps: Record<string, number>;
  CharacterTaunts: Array<Record<string, any>>;
  CharacterLoadouts: Array<Record<string, any>>;
  CharacterMatches: number;
  CharacterLevel: number;
}
interface GameConfig {
  Map: string;
  GameType: string;
  RoomName: string;
}

interface GameInfo {
  MonitorServerProcessCode: string;
  GameServerProcessCode: string;
  CreateTimestamp: number;
  ActivePlayers: number;
  Map: string;
  TeamAPlayers: number;
  TeamBPlayers: number;
  GameConfig: GameConfig;
}

interface TeamPlayerInfo extends PlayerData {
  TeamId: number;
  BannerID: number;
  EmblemID: number;
  RibbonID: number;
  TitleID: string;
  Handle: string;
  CharacterInfo: CharacterInfo;
  CharacterType: number;
  CharacterSkin: CharacterSkin;
  CharacterCards: Record<string, number>;
  CharacterMods: Record<string, number>;
  CharacterAbilityVfxSwaps: Record<string, number>;
  CharacterTaunts: Array<Record<string, any>>;
  CharacterLoadouts: Array<Record<string, any>>;
  CharacterMatches: number;
  CharacterLevel: number;
}

type AbilityGameSummaryList = {
  AbilityClassName: string;
  AbilityName: string;
  ActionType: number;
  CastCount: number;
  ModName: string;
  TauntCount: number;
  TotalAbsorb: number;
  TotalDamage: number;
  TotalEnergyGainOnSelf: number;
  TotalEnergyGainToOthers: number;
  TotalEnergyLossToOthers: number;
  TotalHealing: number;
  TotalPotentialAbsorb: number;
  TotalTargetsHit: number;
};

type PlayerInfo = {
  id: number;
  game_id: number;
  user: string;
  character: string;
  takedowns: number;
  deaths: number;
  deathblows: number;
  damage: number;
  healing: number;
  damage_received: number;
  createdAt: string;
  updatedAt: string;
  team: string;
  TotalHealingReceived: number;
  TotalPlayerAbsorb: number;
  PowerupsCollected: number;
  DamageAvoidedByEvades: number;
  MyIncomingDamageReducedByCover: number;
  MyOutgoingExtraDamageFromEmpowered: number;
  MyOutgoingReducedDamageFromWeakened: number;
  MovementDeniedByMe: number;
  EnemiesSightedPerTurn: number;
  DashCatalystUsed: boolean;
  DashCatalystName: string;
  CombatCatalystUsed: boolean;
  CombatCatalystName: string;
  PrepCatalystUsed: boolean;
  PrepCatalystName: string;
  advancedstats: AbilityGameSummaryList[];
  Deadliest: boolean;
  Supportiest: boolean;
  Tankiest: boolean;
  MostDecorated: boolean;
};

type Game = {
  id: number;
  date: string;
  gameid: number;
  teamwin: string;
  turns: number;
  score: string;
  map: string;
  stats: PlayerInfo[];
  gametype: string;
  server: string;
  version: string;
  channelid: string;
  createdAt: string;
  GameServerProcessCode: string;
};

type Team = {
  [teamName: string]: PlayerInfo[];
};

const fetchInfo = async (
  map: string,
  page: number,
  pageSize: number,
  playerName: string,
  curentType: string,
  gameServerProcessCode: string,
  searchByTurns: string,
  score: string,
  curentTeam: string,
  apiVersion: 'v1' | 'production',
) => {
  try {
    const client = apiVersion === 'v1' ? strapiClientv1 : strapiClient;
    const strapi = client.from('games').select();

    if (gameServerProcessCode !== '') {
      strapi.equalTo('GameServerProcessCode', gameServerProcessCode);
    } else {
      if (map !== 'All Maps') {
        strapi.filterDeep('map', 'eq', map);
      }
      if (playerName !== '') {
        strapi.filterDeep('stats.user', 'contains', playerName);
      }
      strapi.equalTo('gametype', curentType);
      if (searchByTurns !== '') {
        strapi.equalTo('turns', searchByTurns);
      }
      if (score !== '') {
        strapi.equalTo('score', score);
      }
      if (curentTeam !== 'Both') {
        strapi.equalTo('teamwin', curentTeam);
      }
    }

    strapi.populateWith('stats', ['*'], true);
    strapi.populateWith('stats.advancedstats', ['*'], true);

    strapi.sortBy([{ field: 'id', order: 'desc' }]);
    strapi.paginate(page, pageSize);

    const { data, error } = await strapi.get();

    if (error) {
      return [] as Game[];
    }

    return data as Game[];
  } catch (error) {
    return [] as Game[];
  }
};

const fetchCount = async (
  map: string,
  playerName: string,
  curentType: string,
  gameServerProcessCode: string,
  searchByTurns: string,
  score: string,
  curentTeam: string,
  apiVersion: 'v1' | 'production',
) => {
  try {
    const client = apiVersion === 'v1' ? strapiClientv1 : strapiClient;
    const strapi = client.from('games/count').select();

    if (gameServerProcessCode !== '') {
      strapi.equalTo('GameServerProcessCode', gameServerProcessCode);
    } else {
      if (map !== 'All Maps') {
        strapi.filterDeep('map', 'eq', map);
      }
      if (playerName !== '') {
        strapi.filterDeep('stats.user', 'contains', playerName);
      }
      strapi.equalTo('gametype', curentType);
      if (searchByTurns !== '') {
        strapi.equalTo('turns', searchByTurns);
      }
      if (score !== '') {
        strapi.equalTo('score', score);
      }
      if (curentTeam !== 'Both') {
        strapi.equalTo('teamwin', curentTeam);
      }
    }
    const { data, error } = await strapi.get();

    if (error) {
      return 0;
    }
    // @ts-ignore
    return data?.value as number;
  } catch (error) {
    return 0;
  }
};

const sortByTeam = (players: PlayerInfo[]) => {
  return players.sort((a, b) => a.team.localeCompare(b.team));
};

const groupByTeam = (game: Game) => {
  const teams: Team = {};
  game.stats.forEach((player) => {
    if (!teams[player.team]) {
      teams[player.team] = [];
    }
    teams[player.team].push(player);
  });
  return teams;
};

const formatDate = (locale: string, dateString: string) => {
  // const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  // @ts-ignore
  return new Date(dateString).toLocaleDateString(locale, options);
};

const calculateMVPBadge = (player: PlayerInfo, players: PlayerInfo[]) => {
  // New badge calculation if theres advanced stats
  if (player.advancedstats !== null) {
    if (player.MostDecorated) {
      return true;
    }
    return false;
  }

  let mvpPlayer = player;
  let maxCombinedScore =
    (player.damage + player.healing - player.damage_received) /
    (player.deaths + 1);

  players.forEach((p) => {
    const combinedScore =
      (p.damage + p.healing - p.damage_received) / (p.deaths + 1);

    if (combinedScore > maxCombinedScore) {
      maxCombinedScore = combinedScore;
      mvpPlayer = p;
    }
  });

  return mvpPlayer.id === player.id;
};

const calculateHealerBadge = (player: PlayerInfo, players: PlayerInfo[]) => {
  // New badge calculation if theres advanced stats
  if (player.advancedstats !== null) {
    if (player.Supportiest) {
      return true;
    }
    return false;
  }

  let healerPlayer = player;
  let maxHealing = player.healing / (player.deaths + 1);

  players.forEach((p) => {
    const healingPerLife = p.healing / (p.deaths + 1);
    if (healingPerLife > maxHealing) {
      maxHealing = healingPerLife;
      healerPlayer = p;
    }
  });

  return healerPlayer.id === player.id;
};

const calculateDamageBadge = (player: PlayerInfo, players: PlayerInfo[]) => {
  // New badge calculation if theres advanced stats
  if (player.advancedstats !== null) {
    if (player.Deadliest) {
      return true;
    }
    return false;
  }

  let damagePlayer = player;
  let maxDamage = player.damage / (player.deaths + 1);

  players.forEach((p) => {
    const damagePerLife = p.damage / (p.deaths + 1);
    if (damagePerLife > maxDamage) {
      maxDamage = damagePerLife;
      damagePlayer = p;
    }
  });

  return damagePlayer.id === player.id;
};

const calculateTankBadge = (player: PlayerInfo, players: PlayerInfo[]) => {
  // New badge calculation if theres advanced stats
  if (player.advancedstats !== null) {
    if (player.Tankiest) {
      return true;
    }
    return false;
  }

  let tankPlayer = player;
  let maxDamageReceived = player.damage_received / (player.deaths + 1);

  players.forEach((p) => {
    const damageReceivedPerLife = p.damage_received / (p.deaths + 1);
    if (damageReceivedPerLife > maxDamageReceived) {
      maxDamageReceived = damageReceivedPerLife;
      tankPlayer = p;
    }
  });

  return tankPlayer.id === player.id;
};

export function Games({
  game,
  i18n,
  t,
  navigate,
  customPlayers,
}: {
  game: Game;
  i18n: any;
  t: any;
  navigate: any;
  customPlayers?: TeamPlayerInfo[];
}) {
  const { activeUser } = EvosStore();
  const [replay, setReplay] = useState<Uploads | undefined>();
  const [selectedReplay, setSelectedReplay] = useState<ReplayFile>();
  const [loading, setLoading] = useState(false);
  const [logError, setLogError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openAdvancedDialog, setOpenAdvancedDialog] = useState(false);

  useEffect(() => {
    const fetchReplayInfo = async (GameServerProcessCode: string) => {
      try {
        const response = await fetch(
          `${strapiClient.getApiUrl()}/upload/files?filters[name][$contains]=${GameServerProcessCode}`,
        );
        const data = await response.json();

        if (!data || data.length === 0) {
          return;
        }

        setReplay(data[0]);
      } catch (error) {
        // console.error(error);
      }
    };

    fetchReplayInfo(game.GameServerProcessCode);
  }, [game.GameServerProcessCode]);

  const handleOpenReplay = () => {
    const fetchReplay = async (file: string) => {
      try {
        setLoading(true);

        const response = await fetch(file);
        const data = await response.json();
        // console.log(data);
        if (!data) {
          setLoading(false);
          return;
        }

        // Parse log.content to access m_teamInfo_Serialized
        const parsedContent: {
          m_gameInfo_Serialized: string;
          m_teamInfo_Serialized: string;
        } = data;

        // Parse m_gameInfo_Serialized
        const gameInfo: GameInfo = JSON.parse(
          parsedContent.m_gameInfo_Serialized,
        );

        const gameInfoResult = gameInfo;

        // Parse m_teamInfo_Serialized string to JSON
        const teamInfo: TeamPlayerInfo[] = JSON.parse(
          parsedContent.m_teamInfo_Serialized,
        ).TeamPlayerInfo;

        // lowercase Handle to handle
        const TeamPlayerInfoResult = teamInfo.map((player) => ({
          ...player,
          handle: player.Handle,
          bannerBg: player.BannerID,
          bannerFg: player.EmblemID,
          status: player.TitleID,
          factionData: {
            factions: [player.RibbonID],
            selectedRibbonID: player.RibbonID,
          },
        }));
        setSelectedReplay({
          id: '',
          name: replay?.name as string,
          fullPath: '',
          lastModified: new Date(),
          content: data,
          gameInfo: gameInfoResult,
          // @ts-ignore
          TeamPlayerInfo: TeamPlayerInfoResult,
        });

        setLoading(false);
        setOpenDialog(true);
      } catch (error) {
        setLoading(false);
        setLogError(error as string);
      }
    };
    fetchReplay(
      `${strapiClient.getApiUrl().replace('/api', '')}${replay?.url}` as string,
    );
  };
  const handleOpenAdvanced = () => {
    setOpenAdvancedDialog(true);
  };

  return (
    <Paper
      key={game.id}
      elevation={3}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        margin: '1em',
        paddingBottom: '0px',
        padding: '1em',
      }}
    >
      <Grid container spacing={2} sx={{ padding: '1em' }}>
        <Grid item xs={4}>
          <Typography variant="subtitle1" gutterBottom>
            {t('maps.map')}: {t(`maps.${game.map}`)}{' '}
            <a
              href={`https://ptb.discord.com/channels/600425662452465701/${game.channelid}/${game.gameid}`}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              ({t('showInDiscord')})
            </a>
          </Typography>
        </Grid>
        <Grid item xs={3}>
          <Typography variant="subtitle1" gutterBottom>
            {t('stats.score')}: {game.score}
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="subtitle1" gutterBottom>
            {t('stats.turns')}: {game.turns}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="subtitle1" gutterBottom>
            {t('stats.played')}: {formatDate(i18n.language, game.date)}
          </Typography>
        </Grid>
        <Grid item xs={3}>
          <Typography variant="subtitle1" gutterBottom>
            {t('stats.type')}: {game.gametype}
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="subtitle1" gutterBottom>
            {game.GameServerProcessCode} ({t('stats.version')}: {game.version})
          </Typography>
        </Grid>
      </Grid>
      <Box display="flex" flexDirection="column">
        {Object.entries(groupByTeam(game)).map(([team, players]) => (
          <TableContainer
            key={team}
            component={Paper}
            sx={{
              marginBottom: '1em',
            }}
          >
            <Table size="small" aria-label="player stats">
              <TableHead>
                <TableRow>
                  <TableCell width={300}>{t('stats.user')}</TableCell>
                  <TableCell width={customPlayers ? 250 : 150}>
                    {t('stats.character')}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={t('stats.takedowns')}>
                      <div>
                        <PiSwordDuotone />
                      </div>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={t('stats.deaths')}>
                      <div>
                        <GiDeathSkull />
                      </div>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={t('stats.deathblows')}>
                      <div>
                        <PiSwordFill />
                      </div>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={t('stats.damage')}>
                      <div>
                        <GiBroadsword />
                      </div>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={t('stats.healing')}>
                      <div>
                        <GiHealthNormal />
                      </div>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={t('stats.damageReceived')}>
                      <div>
                        <BsShield />
                      </div>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortByTeam(players).map((player) => {
                  const renderedHandles = new Set();
                  return (
                    <TableRow
                      key={player.id}
                      sx={{
                        marginBottom: '1em',
                        backgroundColor:
                          (game.teamwin === 'TeamA' &&
                            player.team === 'TeamA') ||
                          (game.teamwin === 'TeamB' && player.team === 'TeamB')
                            ? '#22c9554f'
                            : '#ff423a4f',
                      }}
                    >
                      <TableCell
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (!denydNames.includes(player.user)) {
                            navigate(
                              `/playerstats?player=${encodeURIComponent(
                                player.user,
                              )}`,
                            );
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div>
                            {customPlayers ? (
                              <Player
                                info={customPlayers.find(
                                  (p) => p.Handle === player.user,
                                )}
                                disableSkew
                                characterType={undefined}
                                titleOld=""
                              />
                            ) : (
                              player.user
                            )}
                          </div>
                          <div style={{ marginLeft: 'auto' }}>
                            {calculateMVPBadge(player, game.stats) &&
                              !customPlayers && (
                                <Tooltip title={t('stats.mvp')}>
                                  <Chip
                                    color="primary"
                                    label=""
                                    size="small"
                                    icon={
                                      <FaRankingStar
                                        style={{ marginLeft: '12px' }}
                                      />
                                    }
                                    sx={{ marginLeft: 1 }} // Add margin to badges
                                  />
                                </Tooltip>
                              )}
                            {calculateHealerBadge(player, game.stats) &&
                              !customPlayers && (
                                <Tooltip title={t('stats.bestSupport')}>
                                  <Chip
                                    color="secondary"
                                    label=""
                                    size="small"
                                    icon={
                                      <GiHealthNormal
                                        style={{ marginLeft: '12px' }}
                                      />
                                    }
                                    sx={{ marginLeft: 1 }} // Add margin to badges
                                  />
                                </Tooltip>
                              )}
                            {calculateDamageBadge(player, game.stats) &&
                              !customPlayers && (
                                <Tooltip title={t('stats.bestDamage')}>
                                  <Chip
                                    color="error"
                                    label=""
                                    size="small"
                                    icon={
                                      <GiBroadsword
                                        style={{ marginLeft: '12px' }}
                                      />
                                    }
                                    sx={{ marginLeft: 1 }} // Add margin to badges
                                  />
                                </Tooltip>
                              )}
                            {calculateTankBadge(player, game.stats) &&
                              !customPlayers && (
                                <Tooltip title={t('stats.bestTank')}>
                                  <Chip
                                    color="info"
                                    label=""
                                    size="small"
                                    icon={
                                      <BsShield
                                        style={{ marginLeft: '12px' }}
                                      />
                                    }
                                    sx={{ marginLeft: 1 }} // Add margin to badges
                                  />
                                </Tooltip>
                              )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {t(`charNames.${player.character.replace(/:3/g, '')}`)}
                        {customPlayers &&
                          customPlayers.map((customPlayer) => {
                            // Check if this handle has already been rendered
                            if (
                              !renderedHandles.has(customPlayer.Handle) &&
                              customPlayer.Handle === player.user
                            ) {
                              // If not rendered yet and matches the current player's handle, render the content
                              renderedHandles.add(customPlayer.Handle); // Mark this handle as rendered
                              const tooltip1 = ability(
                                player.character.replace(/:3/g, ''),
                                0,
                                customPlayer.CharacterInfo.CharacterMods
                                  .ModForAbility0,
                              );
                              const tooltip2 = ability(
                                player.character.replace(/:3/g, ''),
                                1,
                                customPlayer.CharacterInfo.CharacterMods
                                  .ModForAbility1,
                              );
                              const tooltip3 = ability(
                                player.character.replace(/:3/g, ''),
                                2,
                                customPlayer.CharacterInfo.CharacterMods
                                  .ModForAbility2,
                              );
                              const tooltip4 = ability(
                                player.character.replace(/:3/g, ''),
                                3,
                                customPlayer.CharacterInfo.CharacterMods
                                  .ModForAbility3,
                              );
                              const tooltip5 = ability(
                                player.character.replace(/:3/g, ''),
                                4,
                                customPlayer.CharacterInfo.CharacterMods
                                  .ModForAbility4,
                              );

                              return (
                                <div key={customPlayer.Handle}>
                                  <Typography variant="caption">
                                    <Tooltip
                                      arrow
                                      placement="top"
                                      title={
                                        <>
                                          <Typography
                                            variant="h5"
                                            component="div"
                                          >
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: tooltip1.title,
                                              }}
                                            />
                                          </Typography>
                                          <Typography
                                            variant="body1"
                                            component="div"
                                          >
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: tooltip1.tooltip,
                                              }}
                                            />
                                          </Typography>
                                        </>
                                      }
                                    >
                                      <img
                                        src={abilityIcon(
                                          player.character.replace(/:3/g, ''),
                                          1,
                                        )}
                                        alt="ability1"
                                        width={25}
                                        height={25}
                                        style={{ cursor: 'pointer' }}
                                      />
                                    </Tooltip>
                                  </Typography>
                                  <Typography variant="caption">
                                    <Tooltip
                                      arrow
                                      placement="top"
                                      title={
                                        <>
                                          <Typography
                                            variant="h5"
                                            component="div"
                                          >
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: tooltip2.title,
                                              }}
                                            />
                                          </Typography>
                                          <Typography
                                            variant="body1"
                                            component="div"
                                          >
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: tooltip2.tooltip,
                                              }}
                                            />
                                          </Typography>
                                        </>
                                      }
                                    >
                                      <img
                                        src={abilityIcon(
                                          player.character.replace(/:3/g, ''),
                                          2,
                                        )}
                                        alt="ability2"
                                        width={25}
                                        height={25}
                                        style={{ cursor: 'pointer' }}
                                      />
                                    </Tooltip>
                                  </Typography>
                                  <Typography variant="caption">
                                    <Tooltip
                                      arrow
                                      placement="top"
                                      title={
                                        <>
                                          <Typography
                                            variant="h5"
                                            component="div"
                                          >
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: tooltip3.title,
                                              }}
                                            />
                                          </Typography>
                                          <Typography
                                            variant="body1"
                                            component="div"
                                          >
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: tooltip3.tooltip,
                                              }}
                                            />
                                          </Typography>
                                        </>
                                      }
                                    >
                                      <img
                                        src={abilityIcon(
                                          player.character.replace(/:3/g, ''),
                                          3,
                                        )}
                                        alt="ability3"
                                        width={25}
                                        height={25}
                                        style={{ cursor: 'pointer' }}
                                      />
                                    </Tooltip>
                                  </Typography>
                                  <Typography variant="caption">
                                    <Tooltip
                                      arrow
                                      placement="top"
                                      title={
                                        <>
                                          <Typography
                                            variant="h5"
                                            component="div"
                                          >
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: tooltip4.title,
                                              }}
                                            />
                                          </Typography>
                                          <Typography
                                            variant="body1"
                                            component="div"
                                          >
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: tooltip4.tooltip,
                                              }}
                                            />
                                          </Typography>
                                        </>
                                      }
                                    >
                                      <img
                                        src={abilityIcon(
                                          player.character.replace(/:3/g, ''),
                                          4,
                                        )}
                                        alt="ability4"
                                        width={25}
                                        height={25}
                                        style={{ cursor: 'pointer' }}
                                      />
                                    </Tooltip>
                                  </Typography>
                                  <Typography variant="caption">
                                    <Tooltip
                                      arrow
                                      placement="top"
                                      title={
                                        <>
                                          <Typography
                                            variant="h5"
                                            component="div"
                                          >
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: tooltip5.title,
                                              }}
                                            />
                                          </Typography>
                                          <Typography
                                            variant="body1"
                                            component="div"
                                          >
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: tooltip5.tooltip,
                                              }}
                                            />
                                          </Typography>
                                        </>
                                      }
                                    >
                                      <img
                                        src={abilityIcon(
                                          player.character.replace(/:3/g, ''),
                                          5,
                                        )}
                                        alt="ability5"
                                        width={25}
                                        height={25}
                                        style={{
                                          marginRight: '10px',
                                          cursor: 'pointer',
                                        }}
                                      />
                                    </Tooltip>
                                  </Typography>{' '}
                                  {customPlayer.CharacterInfo.CharacterCards
                                    .PrepCard !== 0 && (
                                    <Typography variant="caption">
                                      <img
                                        src={catalystsIcon(
                                          customPlayer.CharacterInfo
                                            .CharacterCards.PrepCard,
                                        )}
                                        alt={customPlayer.CharacterInfo.CharacterCards.PrepCard.toString()}
                                        width={25}
                                        height={25}
                                      />
                                    </Typography>
                                  )}
                                  {customPlayer.CharacterInfo.CharacterCards
                                    .DashCard !== 0 && (
                                    <Typography variant="caption">
                                      <img
                                        src={catalystsIcon(
                                          customPlayer.CharacterInfo
                                            .CharacterCards.DashCard,
                                        )}
                                        alt={customPlayer.CharacterInfo.CharacterCards.DashCard.toString()}
                                        width={25}
                                        height={25}
                                      />
                                    </Typography>
                                  )}
                                  {customPlayer.CharacterInfo.CharacterCards
                                    .CombatCard !== 0 && (
                                    <Typography variant="caption">
                                      <img
                                        src={catalystsIcon(
                                          customPlayer.CharacterInfo
                                            .CharacterCards.CombatCard,
                                        )}
                                        alt={customPlayer.CharacterInfo.CharacterCards.CombatCard.toString()}
                                        width={25}
                                        height={25}
                                      />
                                    </Typography>
                                  )}
                                </div>
                              );
                            }
                            return null; // If already rendered or does not match the current player's handle, render nothing
                          })}
                      </TableCell>
                      <TableCell>{player.takedowns}</TableCell>
                      <TableCell>{player.deaths}</TableCell>
                      <TableCell>{player.deathblows}</TableCell>
                      <TableCell>{player.damage}</TableCell>
                      <TableCell>{player.healing}</TableCell>
                      <TableCell>{player.damage_received}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ))}
      </Box>
      <Box display="flex" flexDirection="row" gap={2}>
        {replay && !customPlayers && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => {
              trackEvent('Open Replay', {
                user: activeUser?.handle || '',
                game: game.GameServerProcessCode,
              });
              handleOpenReplay();
            }}
            sx={{ marginRight: 2 }} // Add margin to the right
          >
            {t('replay.openReplay')}
          </Button>
        )}
        {game.stats.find((player) => player.advancedstats?.length > 0) && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => {
              trackEvent('Open Advanced Stats', {
                user: activeUser?.handle || '',
                game: game.GameServerProcessCode,
              });
              handleOpenAdvanced();
            }}
          >
            {t('advstats.openAdvanced')}
          </Button>
        )}
      </Box>

      {selectedReplay && (
        <ReplayDialog
          selectedReplay={selectedReplay}
          game={game}
          loading={loading}
          logError={logError}
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
          fromLogPage
        />
      )}
      {openAdvancedDialog && (
        <AdvancedDialog
          game={game}
          loading={loading}
          openAdvancedDialog={openAdvancedDialog}
          setOpenAdvancedDialog={setOpenAdvancedDialog}
        />
      )}
    </Paper>
  );
}

interface Props {
  apiVersion?: 'v1' | 'production';
}

export default function PreviousGamesPlayed({
  apiVersion = 'production',
}: Props = {}) {
  const { t, i18n } = useTranslation();

  const [data, setData] = useState<Game[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [selectedMap, setSelectedMap] = useState<string>('All Maps');
  const [curentType, setCurrentType] = useState<string>('PvP');
  const [gameServerProcessCode, setGameServerProcessCode] =
    useState<string>('');
  const [searchByTurns, setSearchByTurns] = useState<string>('');
  const [score, setScore] = useState<string>('');
  const [curentTeam, setCurentTeam] = useState<string>('Both');
  const [searchedPlayer, setSearchedPlayer] = useState<string>('');
  const [errorGameServerProcessCode, setErrorGameServerProcessCode] =
    useState(false);
  const [errorScore, setErrorScore] = useState(false);
  const [errorTurns, setErrorTurns] = useState(false);
  const navigate = useNavigate();

  const regexServerProcessCode =
    /^[a-zA-Z]+-\d+-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}$/;
  const handleInputChangeServerProcessCode = (event: {
    target: { value: string };
  }) => {
    const { value } = event.target;
    setGameServerProcessCode(value);

    if (regexServerProcessCode.test(value)) {
      setErrorGameServerProcessCode(false);
    } else {
      setErrorGameServerProcessCode(true);
    }
  };

  const regexScore = /^(0|[1-9]\d*)-(0|[1-9]\d*)$/;
  const handleInputChangeScore = (event: { target: { value: string } }) => {
    const { value } = event.target;
    setScore(value);

    if (regexScore.test(value)) {
      setErrorScore(false);
    } else {
      setErrorScore(true);
    }
  };

  const regexTurns = /^(0|[1-9]\d*)$/;
  const handleInputChangeTurns = (event: { target: { value: string } }) => {
    const { value } = event.target;
    setSearchByTurns(value);

    if (regexTurns.test(value)) {
      setErrorTurns(false);
    } else {
      setErrorTurns(true);
    }
  };

  const searchGames = useCallback(() => {
    async function fetchData() {
      const [result, result1] = await Promise.all([
        fetchInfo(
          selectedMap,
          currentPage,
          pageSize,
          searchedPlayer,
          curentType,
          gameServerProcessCode,
          searchByTurns,
          score,
          curentTeam,
          apiVersion,
        ),
        fetchCount(
          selectedMap,
          searchedPlayer,
          curentType,
          gameServerProcessCode,
          searchByTurns,
          score,
          curentTeam,
          apiVersion,
        ),
      ]);

      setTotal(result1);
      setData(result);
    }
    fetchData();
  }, [
    selectedMap,
    currentPage,
    pageSize,
    searchedPlayer,
    curentType,
    gameServerProcessCode,
    searchByTurns,
    score,
    curentTeam,
    apiVersion,
  ]);

  useEffect(
    () => {
      searchGames();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number,
  ) => {
    setCurrentPage(page);
    searchGames();
  };

  const handleMapChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSelectedMap(event.target.value);
  };

  const maps = [
    'All Maps',
    'Omni Reactor Core',
    'EvoS Labs',
    'Oblivion',
    'Hexcelence',
    'Flyway Freighter',
    'Cloudspire',
    'Hyperforge',
    'Christmas Cloudspire',
  ];

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
          padding: '1em',
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <Select
                labelId="map-filter-label"
                id="map-filter"
                value={selectedMap}
                onChange={handleMapChange}
                disabled={gameServerProcessCode !== ''}
              >
                {maps.map((map) => (
                  <MenuItem key={map} value={map}>
                    {t(`maps.${map}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <Select
                value={curentType}
                onChange={(event) => setCurrentType(event.target.value)}
                disabled={gameServerProcessCode !== ''}
              >
                <MenuItem value="PvP">{t('stats.pvpgames')}</MenuItem>
                <MenuItem value="Coop">{t('stats.coopgames')}</MenuItem>
                <MenuItem value="FourLancer">
                  {t('stats.fourlancergames')}
                </MenuItem>
                <MenuItem value="Custom">{t('stats.customgames')}</MenuItem>
                <MenuItem value="Tournament">
                  {t('stats.tournamentgames')}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('stats.searchByPlayer')}
              disabled={gameServerProcessCode !== ''}
              variant="outlined"
              value={searchedPlayer}
              onChange={(event) => setSearchedPlayer(event.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="clear text"
                      onClick={() => setSearchedPlayer('')}
                      edge="end"
                      disabled={gameServerProcessCode !== ''}
                    >
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>{t('stats.searchByTeamWin')}</InputLabel>
              <Select
                value={curentTeam}
                onChange={(event) => setCurentTeam(event.target.value)}
                label={t('stats.searchByTeamWin')}
                disabled={gameServerProcessCode !== ''}
              >
                <MenuItem value="Both">{t('stats.Both')}</MenuItem>
                <MenuItem value="TeamA">{t('stats.TeamA')}</MenuItem>
                <MenuItem value="TeamB">{t('stats.TeamB')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <TextField
                label={t('stats.searchByTurns')}
                variant="outlined"
                value={searchByTurns}
                disabled={gameServerProcessCode !== ''}
                onChange={handleInputChangeTurns}
                error={errorTurns}
                helperText={errorTurns ? t('stats.invalidTurnsFormat') : ''}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear text"
                        onClick={() => {
                          setSearchByTurns('');
                          setErrorTurns(false);
                        }}
                        edge="end"
                        disabled={gameServerProcessCode !== ''}
                      >
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <TextField
                label={t('stats.searchByScore')}
                variant="outlined"
                value={score}
                disabled={gameServerProcessCode !== ''}
                onChange={handleInputChangeScore}
                fullWidth
                error={errorScore}
                helperText={errorScore ? t('stats.invalidScoreFormat') : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear text"
                        onClick={() => {
                          setScore('');
                          setErrorScore(false);
                        }}
                        edge="end"
                        disabled={gameServerProcessCode !== ''}
                      >
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <TextField
                label={t('stats.searchByGameServerProcessCode')}
                variant="outlined"
                value={gameServerProcessCode}
                onChange={handleInputChangeServerProcessCode}
                error={errorGameServerProcessCode}
                helperText={
                  errorGameServerProcessCode
                    ? t('stats.invalidGameServerProcessCode')
                    : ''
                }
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear text"
                        onClick={() => {
                          setGameServerProcessCode('');
                          setErrorGameServerProcessCode(false);
                        }}
                        edge="end"
                      >
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                searchGames();
                setCurrentPage(1);
              }}
              disabled={errorGameServerProcessCode || errorScore || errorTurns}
              sx={{ marginRight: 2, height: '57px' }} // Add margin to the right
            >
              {t('search')}
            </Button>
          </Grid>
          <Grid item xs={6} />
          <Grid item xs={6}>
            <Pagination
              count={Math.ceil(total / pageSize)}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              sx={{ float: 'right', marginTop: '1em' }}
            />
          </Grid>
        </Grid>
      </Paper>

      {data.map((game) => (
        <Games
          key={game.id}
          game={game}
          t={t}
          navigate={navigate}
          i18n={i18n}
        />
      ))}
      <Paper
        elevation={3}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
          padding: '1em',
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={6} />
          <Grid item xs={6}>
            <Pagination
              count={Math.ceil(total / pageSize)}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}
