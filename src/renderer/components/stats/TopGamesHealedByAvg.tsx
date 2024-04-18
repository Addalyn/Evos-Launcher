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

export default function TopGamesHealedByAvg() {
  const { t } = useTranslation();

  const [gameData, setGameData] = useState([]);
  const [names, setNames] = useState([]);
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
        text: t('stats.top20HealingDoneAvg'),
      },
    },
  };

  useEffect(() => {
    async function fetchData() {
      const data: DataItem[] = (await fetchGameInfo(
        'totalhealingavg',
      )) as DataItem[];
      setGameData([]);
      setNames([]);
      data.splice(20);
      data.forEach((item) => {
        // @ts-ignore
        setNames((prev) => [...prev, item.user]);
        // @ts-ignore
        setGameData((prev) => [...prev, item.average_healing_per_game]);
      });
    }

    fetchData();
  }, []);

  const data = {
    labels: names,
    datasets: [
      {
        label: t('stats.healingDoneAvg'),
        data: gameData,
        backgroundColor: (context: { dataIndex: number }) => {
          const index = context.dataIndex;
          return index < 5
            ? 'rgba(255, 127, 187, 0.5)'
            : 'rgba(144,202,249,0.5)';
        },
      },
    ],
  };

  return <Bar options={options} data={data} height={500} />;
}
