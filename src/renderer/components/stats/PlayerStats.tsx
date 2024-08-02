import { Skeleton } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchGameInfo } from 'renderer/lib/Evos';

interface Props {
  action: string;
  player: string;
}

interface DataItem {
  total: string;
  user: string;
}

export default function PlayerStats({ action, player }: Props) {
  const { t } = useTranslation();

  const [gameData, setGameData] = useState<string | undefined>();

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function fetchData() {
      const data: DataItem[] = await fetchGameInfo(action, signal);
      data.forEach((item) => {
        if (item.user !== player) return;
        setGameData(item.total);
      });
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [action, player]);

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
      {!gameData ? (
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
