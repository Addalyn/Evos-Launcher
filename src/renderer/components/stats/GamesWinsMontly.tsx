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

interface DataSubItem {
  id: number;
  game_id: number;
  team: string;
  user: string;
}

interface DataItem {
  id: number;
  teamwin: string;
  stats: DataSubItem[];
  date: string;
  map: string;
}

const currentMonth = new Date().getMonth(); // Get the current month (0-11)

// Generate labels for the whole year starting from the current month
const labels = Array.from({ length: 12 }, (_, i) => {
  const monthIndex = (currentMonth - i + 12) % 12; // Ensure the month index wraps around
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return monthNames[monthIndex];
});

function formatDateForStrapi(date: Date) {
  return date.toISOString();
}

function getMonthFromString(mon: string) {
  return new Date(Date.parse(`${mon} 1, 2012`)).getMonth() + 1;
}

const fetchInfo = async (month: string, map: string, player: string) => {
  try {
    const currentDate = new Date();
    currentDate.setMonth(getMonthFromString(month));
    const startDate = formatDateForStrapi(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1,
        2,
        0,
        0
      )
    );

    const lastDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    );
    const endDate = formatDateForStrapi(
      new Date(
        lastDay.getFullYear(),
        lastDay.getMonth(),
        lastDay.getDate(),
        23,
        59,
        59
      )
    );

    const strapi = strapiClient
      .from<DataItem>('games')
      .select(['teamwin'])
      .greaterThan('date', startDate)
      .lessThan('date', endDate)
      .populateDeep([
        {
          path: 'stats',
          fields: ['team', 'user'],
        },
      ]);

    if (map !== 'All Maps') {
      strapi.equalTo('map', map);
    }

    strapi.filterDeep('stats.user', 'eq', player);

    strapi.paginate(1, 100000);
    const { data, error } = await strapi.get();

    if (error) {
      return 0;
    }
    let wins = 0;
    let losses = 0;

    data?.forEach((record) => {
      record.stats.forEach((item) => {
        if (item.user === player) {
          if (record.teamwin === item.team) {
            wins += 1;
          } else {
            losses += 1;
          }
        }
      });
    });

    return [wins, losses];
  } catch (error) {
    return [];
  }
};

interface Props {
  map: string;
  player: string;
}

export default function GamesWinsMontly({ map, player }: Props) {
  const [gameData, setGameData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const dataPromises = labels.map((month) => fetchInfo(month, map, player));
      const data = await Promise.all(dataPromises);
      // @ts-ignore
      setGameData(data);
    }

    fetchData();
  }, [map, player]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Wins and Losses`,
      },
    },
  };
  const datasets = [
    {
      label: `Wins`,
      data: gameData.map((item) => item[0]),
      backgroundColor: 'rgba(144, 202, 249, 0.5)',
    },
    {
      label: 'Losses',
      data: gameData.map((item) => item[1]),
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
  ];
  const data = {
    labels,
    datasets,
  };

  return <Bar options={options} data={data} height={300} />;
}
