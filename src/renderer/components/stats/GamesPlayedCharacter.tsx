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

interface Props {
  map: string;
  player: string;
}

const names = [
  /* Firepower */
  'Blackburn',
  'Celeste',
  'Elle',
  'Gremolitions Inc.',
  'Grey',
  'Juno',
  'Kaigin',
  // 'Lex',
  'Lockwood',
  // 'Nev',
  'Nix',
  'OZ',
  'PuP',
  'Tol-Ren',
  // 'Vonn',
  'Zuki',
  /* Frontline */
  'Asana',
  'Brynn',
  'Garrison',
  // 'Isadora',
  // 'Magnus',
  'Phaedra',
  'Rampart',
  'Rask',
  'Titus',
  /* Support */
  'Aurora',
  'Dr. Finn',
  'Helio',
  'Khita',
  'Meridian',
  'Orion',
  'Quark',
  'Su-Ren',
];

const characterCategories: { [key: string]: string } = {
  Blackburn: 'Firepower',
  Celeste: 'Firepower',
  Elle: 'Firepower',
  'Gremolitions Inc.': 'Firepower',
  Grey: 'Firepower',
  Juno: 'Firepower',
  Kaigin: 'Firepower',
  Lockwood: 'Firepower',
  Nix: 'Firepower',
  OZ: 'Firepower',
  PuP: 'Firepower',
  'Tol-Ren': 'Firepower',
  Zuki: 'Firepower',
  Asana: 'Frontline',
  Brynn: 'Frontline',
  Garrison: 'Frontline',
  Phaedra: 'Frontline',
  Rampart: 'Frontline',
  Rask: 'Frontline',
  Titus: 'Frontline',
  Aurora: 'Support',
  'Dr. Finn': 'Support',
  Helio: 'Support',
  Khita: 'Support',
  Meridian: 'Support',
  Orion: 'Support',
  Quark: 'Support',
  'Su-Ren': 'Support',
};

const categoryColors: { [key: string]: string } = {
  Firepower: 'rgba(255, 99, 132, 0.5)',
  Frontline: 'rgba(54, 162, 235, 0.5)',
  Support: 'rgba(75, 192, 192, 0.5)',
};

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

  const characterColors = names.map((character) => {
    const category = characterCategories[character];
    return categoryColors[category] || 'rgba(144, 202, 249, 0.5)';
  });

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
        backgroundColor: characterColors,
      },
    ],
  };

  return <Bar options={options} data={data} height={300} />;
}
