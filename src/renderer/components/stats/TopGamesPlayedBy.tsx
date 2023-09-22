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
  total: string;
  user: string;
}

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
      text: 'Top 20 players by games played',
    },
  },
};

const fetchInfo = async () => {
  try {
    const strapi = strapiClient.from('stats/playercount').select();

    const { data, error } = await strapi.get();

    if (error) {
      return 0;
    }
    // @ts-ignore
    return data;
  } catch (error) {
    return [];
  }
};

export default function TopGamesPlayedBy() {
  const [gameData, setGameData] = useState([]);
  const [names, setNames] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data: DataItem[] = (await fetchInfo()) as DataItem[];
      setGameData([]);
      setNames([]);
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
        label: 'Games Played',
        data: gameData,
        backgroundColor: 'rgba(144,202,249,0.5)',
      },
    ],
  };

  return <Bar options={options} data={data} height={500} />;
}
