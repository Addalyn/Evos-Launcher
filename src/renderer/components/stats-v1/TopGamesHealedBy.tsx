import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';

import { Bar } from 'react-chartjs-2';
import { fetchGameInfo } from 'renderer/lib/Evos';
import { useTranslation } from 'react-i18next';
import EvosStore from 'renderer/lib/EvosStore';
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
  total: string;
  user: string;
}

export default function TopGamesHealedBy() {
  const { t } = useTranslation();
  const { activeUser } = EvosStore();
  const [gameData, setGameData] = useState([]);
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);
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
        text: t('stats.top20HealingDone'),
      },
    },
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function fetchData() {
      const data: DataItem[] = (await fetchGameInfo(
        'totalhealing',
        signal,
      )) as DataItem[];
      setGameData([]);
      setNames([]);
      data.splice(20);
      data.forEach((item) => {
        // @ts-ignore
        setNames((prev) => [...prev, item.user]);
        // @ts-ignore
        setGameData((prev) => [...prev, item.total]);
      });
      setLoading(false);
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  const data = {
    labels: names,
    datasets: [
      {
        label: t('stats.healingDone'),
        data: gameData,
        backgroundColor: (context: { dataIndex: number }) => {
          const index = context.dataIndex;
          if (activeUser?.handle && names[index] === activeUser.handle) {
            return 'rgb(102, 255, 51)';
          }
          if (index < 5) {
            return 'rgba(255, 127, 187, 0.5)'; // replace 'specialColor' with your desired color
          }
          return 'rgba(144,202,249,0.5)';
        },
      },
    ],
  };

  if (loading) {
    return <Skeleton variant="rectangular" width="100%" height={500} />;
  }

  return <Bar options={options} data={data} height={500} />;
}
