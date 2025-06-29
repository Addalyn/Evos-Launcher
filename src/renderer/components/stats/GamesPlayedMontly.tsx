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

// Generate labels for the past 60 months (5 years) starting from the current month
const labels = Array.from({ length: 60 }, (_, i) => {
  const date = new Date();
  date.setMonth(date.getMonth() - i);
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
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
});

function formatDateForStrapi(date: Date) {
  return date.toISOString();
}

function getMonthAndYearFromString(label: string) {
  const [month, year] = label.split(' ');
  return {
    month: new Date(Date.parse(`${month} 1, 2012`)).getMonth(),
    year: parseInt(year, 10),
  };
}

const fetchInfo = async (
  map: string,
  player: string,
  startDate: string,
  endDate: string,
) => {
  try {
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
    return 0;
  }
};

interface Props {
  map: string;
  player: string;
}

export default function GamesPlayedMonthly({ map, player }: Props) {
  const { t } = useTranslation();

  const [gameData, setGameData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchData() {
      const dataPromises = labels.map((label) => {
        const { month, year } = getMonthAndYearFromString(label);

        const startDate = formatDateForStrapi(
          new Date(year, month, 1, 0, 0, 0),
        );

        const lastDay = new Date(year, month + 1, 0);
        const endDate = formatDateForStrapi(
          new Date(
            lastDay.getFullYear(),
            lastDay.getMonth(),
            lastDay.getDate(),
            23,
            59,
            59,
          ),
        );

        return fetchInfo(map, player, startDate, endDate);
      });

      const data = await Promise.all(dataPromises);
      // Filter out months with no data
      const filteredData = data
        // @ts-ignore
        .map((count: number, index: number) =>
          count > 0 ? { count, label: labels[index] } : null,
        )
        // @ts-ignore
        .filter((item: null) => item !== null);

      // @ts-ignore
      setGameData(filteredData);
      setLoading(false);
    }

    fetchData();
  }, [map, player]);

  // Calculate the total games played per month
  // @ts-ignore
  const gamesPlayedPerMonth = gameData.map((item) => item.count);
  // @ts-ignore
  const labelsWithData = gameData.map((item) => item.label);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${t('stats.gamesPlayed')} ${
          player !== '' ? `${t('stats.by')} ${player} ` : ''
        }${t('stats.perMonth')} ${gamesPlayedPerMonth.reduce(
          (a, b) => a + b,
          0,
        )} ${t('stats.gamesPlayed')}`,
      },
    },
  };
  const data = {
    labels: labelsWithData.map(
      (label: string) =>
        `${t(`months.${label.split(' ')[0]}`)} ${label.split(' ')[1]}`,
    ),
    datasets: [
      {
        label: `${t('stats.gamesPlayed')} ${player !== '' ? `${t('stats.by')} ${player}` : ''}`,
        data: gamesPlayedPerMonth,
        backgroundColor: 'rgba(144,202,249,0.5)',
      },
    ],
  };

  if (loading) {
    return <Skeleton variant="rectangular" width="100%" height={300} />;
  }

  return <Bar options={options} data={data} height={300} />;
}
