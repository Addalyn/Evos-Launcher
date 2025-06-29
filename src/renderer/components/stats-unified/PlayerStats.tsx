import { Skeleton } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface Props {
  action: string;
  player: string;
  apiVersion: 'v1' | 'production';
}

interface DataItem {
  total: string;
  user: string;
}

const fetchGameInfoUnified = async (
  action: string,
  apiVersion: 'v1' | 'production',
  signal?: AbortSignal,
) => {
  const baseUrl =
    apiVersion === 'v1'
      ? 'https://stats-v1.evos.live/'
      : 'https://stats-production.evos.live/';
  const url = `${baseUrl}api/stats/${action}`;

  try {
    const response = await axios.get(url, { signal });
    return response.data.data as DataItem[];
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
      return [] as DataItem[];
    }
    return [] as DataItem[];
  }
};

export default function PlayerStats({
  action,
  player,
  apiVersion = 'production',
}: Props) {
  const { t } = useTranslation();

  const [gameData, setGameData] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function fetchData() {
      const data: DataItem[] = await fetchGameInfoUnified(
        action,
        apiVersion,
        signal,
      );
      data.forEach((item) => {
        if (item.user !== player) return;
        setGameData(item.total);
        setLoading(false);
      });
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [action, player, apiVersion]);

  const actionToName: Record<string, string> = {
    totaldamage: t('stats.totaldamage'),
    totaldamagereceived: t('stats.totaldamagereceived'),
    totaldeaths: t('stats.totaldeaths'),
    totaltakedowns: t('stats.totaltakedowns'),
    totaldeathblows: t('stats.totaldeathblows'),
    totalhealing: t('stats.totalhealing'),
  };

  return (
    <div>
      {actionToName[action]}:{' '}
      {loading ? (
        <Skeleton
          variant="text"
          width={50}
          style={{ display: 'inline-block', marginLeft: '4px' }}
        />
      ) : (
        gameData?.toLocaleString()
      )}
    </div>
  );
}
