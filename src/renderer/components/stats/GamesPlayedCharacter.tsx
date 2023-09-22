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

const names = [
  'Khita',
  'Asana',
  'Zuki',
  'Elle',
  'Titus',
  // 'Meridian',
  'Aurora',
  // 'Magnus',
  'Juno',
  // 'Lex',
  'Dr. Finn',
  'Gremolitions Inc.',
  // 'Vonn',
  'Phaedra',
  'Orion',
  'Helio',
  // 'Nev',
  'Rask',
  'Rampart',
  'PuP',
  'Tol-Ren',
  // 'Isadora',
  'Lockwood',
  'Su-Ren',
  'Nix',
  'Blackburn',
  'Garrison',
  'Quark',
  'Kaigin',
  'Celeste',
  'Grey',
  'OZ',
  'Brynn',
];

const fetchInfo = async (character: string, map: string, player: string) => {
  try {
    const strapi = strapiClient.from('stats/count').select(['id']);

    strapi.equalTo('character', character);

    if (map !== 'All Maps') {
      strapi.filterDeep('game.map', 'eq', map);
    }

    if (player !== '') {
      strapi.equalTo('user', player);
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

export default function GamesPlayedCharacter({ map, player }: Props) {
  const [gameData, setGameData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const dataPromises = names.map((character) =>
        fetchInfo(character, map, player)
      );
      const data = await Promise.all(dataPromises);
      // @ts-ignore
      setGameData(data);
    }
    setGameData([]);
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
        }Per Character`,
      },
    },
  };

  const data = {
    labels: names,
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
