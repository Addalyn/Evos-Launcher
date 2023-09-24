import { useEffect, useState } from 'react';
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
  const [gameData, setGameData] = useState<string | undefined>();

  useEffect(() => {
    async function fetchData() {
      const data: DataItem[] = await fetchGameInfo(action);
      data.forEach((item) => {
        if (item.user !== player) return;
        setGameData(item.total);
      });
    }

    fetchData();
  }, [action, player]);

  const actionToName: Record<string, string> = {
    totaldamage: 'Total Damage Dealt',
    totaldamagereceived: 'Total Damage Received',
    totaldeaths: 'Total Deaths',
    totaltakedowns: 'Total Takedowns',
    totaldeathblows: 'Total Deathblows',
    totalhealing: 'Total Healing',
  };

  return (
    <div>
      {actionToName[action]}: {gameData?.toLocaleString()}
    </div>
  );
}
