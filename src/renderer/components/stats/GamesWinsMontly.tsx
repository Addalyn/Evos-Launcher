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
  winrate?: string;
}

interface FetchInfoResult {
  wins: number;
  losses: number;
}

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

function formatDateForStrapi(date: Date): string {
  return date.toISOString();
}

function getMonthAndYearFromString(label: string): {
  month: number;
  year: number;
} {
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
): Promise<FetchInfoResult> => {
  try {
    const strapi = strapiClient
      .from<DataItem>('games')
      .select(['winrate'])
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
      return { wins: 0, losses: 0 };
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

    return { wins, losses };
  } catch (error) {
    return { wins: 0, losses: 0 };
  }
};

interface Props {
  map: string;
  player: string;
}

interface GameDataItem {
  counts: FetchInfoResult;
  label: string;
}

export default function GamesWinsMonthly({ map, player }: Props) {
  const { t } = useTranslation();
  const { activeUser, isDev } = EvosStore();
  const [gameData, setGameData] = useState<GameDataItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      const dataPromises = labels.map(async (label) => {
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

        const counts = await fetchInfo(map, player, startDate, endDate);
        return { counts, label };
      });

      const data = await Promise.all(dataPromises);
      // Filter out months with no data
      const filteredData = data.filter(
        (item) => item.counts.wins > 0 || item.counts.losses > 0,
      );

      setGameData(filteredData);
    }

    fetchData();
  }, [activeUser?.handle, isDev, map, player]);

  // Calculate the total wins and losses per month
  const winsPerMonth = gameData.map((item) => item.counts.wins);
  const lossesPerMonth = gameData.map((item) => item.counts.losses);
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
        text: t('stats.statsWinsAndLosses'),
      },
    },
  };

  const datasets = [
    {
      label: t('stats.wins'),
      data: winsPerMonth,
      backgroundColor: 'rgba(144, 202, 249, 0.5)',
    },
    {
      label: t('stats.losses'),
      data: lossesPerMonth,
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
  ];

  const data = {
    labels: labelsWithData.map((label: string) => {
      const [month, year] = label.split(' ');
      return `${t(`months.${month}`)} ${year}`;
    }),
    datasets,
  };

  if (gameData.length === 0) {
    return <Skeleton variant="rectangular" width="100%" height={300} />;
  }

  if (player === activeUser?.handle || isDev) {
    return <Bar options={options} data={data} height={300} />;
  }
  return null;
}
