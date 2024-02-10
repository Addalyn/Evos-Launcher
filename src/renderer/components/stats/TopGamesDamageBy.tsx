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

export default function TopGamesDamageBy() {
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
        text: t('stats.top20Damage'),
      },
    },
  };

  useEffect(() => {
    async function fetchData() {
      const data: DataItem[] = (await fetchGameInfo(
        'totaldamage',
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
    }

    fetchData();
  }, []);

  const data = {
    labels: names,
    datasets: [
      {
        label: t('stats.damageDealt'),
        data: gameData,
        backgroundColor: 'rgba(144,202,249,0.5)',
      },
    ],
  };

  return <Bar options={options} data={data} height={500} />;
}
