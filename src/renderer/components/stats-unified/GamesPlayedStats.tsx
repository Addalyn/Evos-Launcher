import { useEffect, useState } from 'react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import CharacterStatsChart from './CharacterStatsChart';
import { Skeleton } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const fetchInfo = async (
  map: string,
  player: string,
  apiVersion: 'v1' | 'production',
) => {
  try {
    const baseUrl =
      apiVersion === 'v1'
        ? 'https://stats-v1.evos.live/'
        : 'https://stats-production.evos.live/';
    const apiUrl = `${baseUrl}api/stats/playerstats?user=${encodeURIComponent(
      player,
    )}${map === 'All Maps' ? '' : `&map=${encodeURIComponent(map)}`}`;

    const response = await axios.get(apiUrl);

    // Assuming strapiClient.get() returns similar data structure
    const { data, error } = response.data;

    if (error) {
      return 0;
    }

    // @ts-ignore
    return data || [];
  } catch (error) {
    return [];
  }
};

interface Props {
  map: string;
  player: string;
  apiVersion: 'v1' | 'production';
}

export default function GamesPlayedStats({
  map,
  player,
  apiVersion = 'production',
}: Props) {
  const [gameData, setGameData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchData() {
      const data = await fetchInfo(map, player, apiVersion);
      // @ts-ignore
      setGameData(data);
      setLoading(false);
    }

    fetchData();
  }, [map, player, apiVersion]);

  if (loading) {
    return <Skeleton variant="rectangular" width="100%" height={300} />;
  }

  return (
    <CharacterStatsChart
      data={gameData}
      player={player}
      map={map}
      apiVersion={apiVersion}
    />
  );
}
