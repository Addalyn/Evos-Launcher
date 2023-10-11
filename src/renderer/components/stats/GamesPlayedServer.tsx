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
import { Bar } from 'react-chartjs-2';
import { strapiClient } from 'renderer/lib/strapi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DataItem {
  total: number;
  server: string;
}

const fetchInfo = async () => {
  try {
    const strapi = strapiClient
      .from<DataItem>('games/totalgamesbyserver')
      .select();

    const { data, error } = await strapi.get();

    if (error) {
      return [];
    }

    return data;
  } catch (error) {
    return [];
  }
};

export default function GamesPlayedServer() {
  const [gameData, setGameData] = useState<DataItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      const data = await fetchInfo();
      setGameData(data || []);
    }
    fetchData();
  }, []);

  const options = {
    responsive: true,
    indexAxis: 'y' as const,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Top played Gameservers`,
      },
    },
  };
  const datasets = [
    {
      label: `Total Games Played`,
      data: gameData.map((item) => item.total),
      backgroundColor: 'rgba(144, 202, 249, 0.5)',
    },
  ];
  const data = {
    labels: gameData.map((item) => item.server),
    datasets,
  };

  return <Bar options={options} data={data} height={300} />;
}
