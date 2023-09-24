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
      .from('games/count')
      .select(['id'])
      .greaterThan('date', startDate)
      .lessThan('date', endDate);

    if (map !== 'All Maps') {
      strapi.equalTo('map', map);
    }

    if (player !== '') {
      strapi.filterDeep('stats.user', 'eq', player);
    }

    const { data, error } = await strapi.get();

    if (error) {
      return 0;
    }
    // @ts-ignore
    return data?.value || 0;
  } catch (error) {
    return [];
  }
};

interface Props {
  map: string;
  player: string;
}

export default function GamesPlayedMonthly({ map, player }: Props) {
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

  // Calculate the total games played per month
  const gamesPlayedPerMonth = gameData.map((gamesInMonth) => gamesInMonth || 0);
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Games Played ${
          player !== '' ? `by ${player} ` : ''
        }Per Month, With a total of ${gameData.reduce(
          (a, b) => a + b,
          0
        )} games played`,
      },
    },
  };
  const data = {
    labels,
    datasets: [
      {
        label: `Games Played ${player !== '' ? `by ${player}` : ''}`,
        data: gamesPlayedPerMonth,
        backgroundColor: 'rgba(144,202,249,0.5)',
      },
    ],
  };

  return <Bar options={options} data={data} height={300} />;
}
