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
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
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
  const { t } = useTranslation();

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
        text: t('stats.topPlayedServers'),
      },
    },
  };
  const datasets = [
    {
      label: t('stats.totalGamesPlayed'),
      data: gameData.map((item) => item.total),
      backgroundColor: 'rgba(144, 202, 249, 0.5)',
    },
  ];
  const data = {
    labels: gameData.map((item) => item.server),
    datasets,
  };

  if (gameData.length === 0) {
    return <Skeleton variant="rectangular" width="100%" height={300} />;
  }

  return <Bar options={options} data={data} height={300} />;
}
