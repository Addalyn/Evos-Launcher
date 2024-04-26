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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const fetchInfo = async (map: string, player: string) => {
  try {
    const apiUrl = `https://stats-production.evos.live/api/stats/playerstats?user=${encodeURIComponent(
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
}

export default function GamesPlayedStats({ map, player }: Props) {
  const [gameData, setGameData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await fetchInfo(map, player);
      // @ts-ignore
      setGameData(data);
    }

    fetchData();
  }, [map, player]);

  return <CharacterStatsChart data={gameData} player={player} map={map} />;
}
