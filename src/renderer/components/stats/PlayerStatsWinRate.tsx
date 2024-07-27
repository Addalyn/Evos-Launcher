/* eslint-disable react/require-default-props */
import { useEffect, useState } from 'react';
import { Grid, Skeleton } from '@mui/material';
import { strapiClient } from 'renderer/lib/strapi';
import { useTranslation } from 'react-i18next';
import EvosStore from 'renderer/lib/EvosStore';

interface Props {
  player: string;
  characterName?: string;
  map?: string;
}

interface DataSubItem {
  id: number;
  game_id: number;
  team: string;
  user: string;
}

interface DataItem {
  id: number;
  teamwin: string;
  gametype: string;
  map: string;
  stats: DataSubItem[];
  winrate?: string;
}

export async function fetchGameInfo(
  playerName: string,
  characterName?: string,
  map?: string,
) {
  try {
    const strapi = strapiClient
      .from<DataItem>(`games`)
      .select(['winrate'])
      .populateDeep([
        {
          path: 'stats',
          fields: ['team', 'user'],
        },
      ]);
    strapi.equalTo('gametype', 'PvP');
    strapi.filterDeep('stats.user', 'contains', playerName);

    if (characterName) {
      strapi.filterDeep('stats.character', 'eq', characterName);
    }

    if (map && map !== 'All Maps') {
      strapi.equalTo('map', map);
    }

    strapi.paginate(1, 100000);

    const { data, error } = (await strapi.get()) as {
      data: DataItem[];
      error: unknown;
    };

    if (error) {
      return [] as DataItem[];
    }
    if (data !== undefined) {
      return data as DataItem[];
    }
    return [] as DataItem[];
  } catch (error) {
    return [] as DataItem[];
  }
}

export default function PlayerWinRate({ player, characterName, map }: Props) {
  const { t } = useTranslation();
  const { activeUser, isDev } = EvosStore();
  const [wins, setWins] = useState<number>(-1);
  const [losses, setLosses] = useState<number>(-1);
  const [winRate, setWinRate] = useState<number>(-1);

  useEffect(() => {
    async function fetchData() {
      const data: DataItem[] = await fetchGameInfo(player, characterName, map);
      setWins(0);
      setLosses(0);
      setWinRate(0);
      data.forEach((record) => {
        record.stats.forEach((item) => {
          if (item.user === player) {
            if (record.teamwin === item.team) {
              setWins((prev) => prev + 1);
            } else {
              setLosses((prev) => prev + 1);
            }
          }
        });
      });
      if (wins === 0 && losses === 0) return;
      const totalGames = wins + losses;
      setWinRate((wins / totalGames) * 100);
    }
    if (player === activeUser?.handle || isDev) {
      fetchData();
    }
  }, [characterName, losses, player, wins, map, activeUser?.handle, isDev]);

  if (player === activeUser?.handle || isDev) {
    return (
      <>
        <Grid item xs={4}>
          {t('stats.wins')}:
          {wins === -1 ? (
            <Skeleton
              variant="text"
              width={50}
              style={{ display: 'inline-block', marginLeft: '4px' }}
            />
          ) : (
            wins
          )}
        </Grid>
        <Grid item xs={4}>
          {t('stats.losses')}:
          {losses === -1 ? (
            <Skeleton
              variant="text"
              width={50}
              style={{ display: 'inline-block', marginLeft: '4px' }}
            />
          ) : (
            losses
          )}
        </Grid>
        <Grid item xs={4}>
          {t('stats.winrate')}:
          {winRate === -1 ? (
            <Skeleton
              variant="text"
              width={50}
              style={{ display: 'inline-block', marginLeft: '4px' }}
            />
          ) : (
            <>{winRate.toFixed(2)}%</>
          )}
        </Grid>
      </>
    );
  }
  return null;
}
