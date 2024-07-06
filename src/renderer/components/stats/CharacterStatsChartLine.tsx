import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useEffect, useState } from 'react';

import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Line } from 'react-chartjs-2';
import { strapiClient } from 'renderer/lib/strapi';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

interface CharacterStatsChartLineProps {
  character: string;
  player: string;
  map: string;
}

interface Stats {
  id: number;
  game_id: number;
  user: string;
  character: string;
  takedowns: number;
  deaths: number;
  deathblows: number;
  damage: number;
  healing: number;
  damage_received: number;
  createdAt: string;
  updatedAt: string;
  team: string;
  gametype: string;
}

interface Average {
  avg: number;
}
interface Statistics {
  averageForAll: Average[];
  averageForUser: Average[];
}

interface Data {
  damage: Statistics;
  healing: Statistics;
  tanking: Statistics;
}

const characterCategories: { [key: string]: string } = {
  Blackburn: 'Firepower',
  Celeste: 'Firepower',
  Elle: 'Firepower',
  'Gremolitions Inc.': 'Firepower',
  Grey: 'Firepower',
  Juno: 'Firepower',
  Kaigin: 'Firepower',
  Lockwood: 'Firepower',
  'NEV:3': 'Firepower',
  Nix: 'Firepower',
  OZ: 'Firepower',
  PuP: 'Firepower',
  'Tol-Ren': 'Firepower',
  Zuki: 'Firepower',
  Vonn: 'Firepower',
  Lex: 'Firepower',
  Asana: 'Frontline',
  Magnus: 'Frontline',
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

const fetchInfo = async (map: string, player: string, character: string) => {
  try {
    const strapi = strapiClient.from<Stats>('stats').select();

    strapi.equalTo('character', character);

    if (map !== 'All Maps') {
      strapi.filterDeep('game.map', 'eq', map);
    }
    strapi.equalTo('gametype', 'PvP');
    strapi.equalTo('user', player);

    strapi.paginate(0, 20);
    strapi.sortBy([{ field: 'id', order: 'desc' }]);

    const { data, error } = await strapi.get();

    if (error) {
      return [];
    }

    // @ts-ignore
    return data || [];
  } catch (error) {
    return [];
  }
};

const getAverage = async (map: string, player: string, character: string) => {
  try {
    const strapi = strapiClient
      .from<Data>(
        `stats/average?character=${encodeURIComponent(character)}&user=${encodeURIComponent(player)}${map !== 'All Maps' ? `?map=${encodeURIComponent(map)}` : ''}`,
      )
      .select();

    const { data, error } = await strapi.get();

    if (error) {
      return null;
    }
    // @ts-ignore
    return data || null;
  } catch (error) {
    return null;
  }
};

export default function CharacterStatsChartLine({
  character,
  player,
  map,
}: CharacterStatsChartLineProps) {
  const { t } = useTranslation();

  const [gameData, setGameData] = useState<Stats[]>([]);
  const [average, setAverage] = useState<Data>();

  const getOrCreateTooltip = (chart: {
    canvas: {
      parentNode: {
        querySelector: (arg0: string) => any;
        appendChild: (arg0: any) => void;
      };
    };
  }) => {
    let tooltipEl = chart.canvas.parentNode.querySelector('div');

    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
      tooltipEl.style.borderRadius = '3px';
      tooltipEl.style.color = 'white';
      tooltipEl.style.opacity = 1;
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.transform = 'translate(-50%, 0)';
      tooltipEl.style.transition = 'all .1s ease';

      const table = document.createElement('table');
      table.style.margin = '0px';

      tooltipEl.appendChild(table);
      chart.canvas.parentNode.appendChild(tooltipEl);
    }

    return tooltipEl;
  };

  const externalTooltipHandler = (context: { chart: any; tooltip: any }) => {
    // Tooltip Element
    const { chart, tooltip } = context;
    const tooltipEl = getOrCreateTooltip(chart);

    // Hide if no tooltip
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    // Set Text
    if (tooltip.body) {
      const titleLines = tooltip.title || [];
      const bodyLines = tooltip.body.map((b: { lines: any }) => b.lines);

      const tableHead = document.createElement('thead');

      titleLines.forEach((title: string) => {
        const tr = document.createElement('tr');
        tr.style.borderWidth = '0';

        const th = document.createElement('th');
        th.style.borderWidth = '0';
        const text = document.createTextNode(title);

        th.appendChild(text);
        tr.appendChild(th);
        tableHead.appendChild(tr);
      });

      const tableBody = document.createElement('tbody');
      bodyLines.forEach((body: string, i: string | number) => {
        const colors = tooltip.labelColors[i];

        const span = document.createElement('span');
        span.style.background = colors.backgroundColor;
        span.style.borderColor = colors.borderColor;
        span.style.borderWidth = '2px';
        span.style.marginRight = '10px';
        span.style.height = '10px';
        span.style.width = '10px';
        span.style.display = 'inline-block';

        const tr = document.createElement('tr');
        tr.style.backgroundColor = 'inherit';
        tr.style.borderWidth = '0';

        const td = document.createElement('td');
        td.style.borderWidth = '0';

        const text = document.createTextNode(body);

        td.appendChild(span);
        td.appendChild(text);
        tr.appendChild(td);
        tableBody.appendChild(tr);
      });

      const tableRoot = tooltipEl.querySelector('table');

      // Remove old children
      while (tableRoot.firstChild) {
        tableRoot.firstChild.remove();
      }

      // Add new children
      tableRoot.appendChild(tableHead);
      tableRoot.appendChild(tableBody);
    }

    const {
      offsetLeft: positionX,
      offsetTop: positionY,
      offsetWidth: chartWidth,
    } = chart.canvas;
    const tooltipWidth = tooltipEl.offsetWidth;
    let leftPosition = positionX + tooltip.caretX;
    const topPosition = positionY + tooltip.caretY;
    if (leftPosition + tooltipWidth > positionX + chartWidth) {
      leftPosition = positionX + chartWidth - tooltipWidth;
    }
    tooltipEl.style.opacity = 1;
    tooltipEl.style.zIndex = 9999;
    tooltipEl.style.left = `${leftPosition}px`;
    tooltipEl.style.top = `${topPosition}px`;
    tooltipEl.style.font = tooltip.options.bodyFont.string;
  };

  const options = {
    responsive: true,
    // indexAxis: 'z' as const,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: t('stats.Last20PvPGames'),
      },
      datalabels: {
        display: true,
        backgroundColor(context: {
          active: any;
          dataset: { borderColor: any };
        }) {
          return context.active ? context.dataset.borderColor : 'white';
        },
        borderColor(context: { dataset: { borderColor: any } }) {
          return context.dataset.borderColor;
        },
        borderWidth: 3,
        color: 'black',
        font: {
          weight: 'bold',
        },
        formatter(
          value: { y: string },
          context: { active: any; dataset: { label: string } },
        ) {
          return context.active ? value?.y : value?.y;
        },
        offset: 8,
        padding: 5,
        textAlign: 'center',
      },
      tooltip: {
        enabled: false,
        position: 'nearest',
        external: externalTooltipHandler,
      },
    },
    layout: {
      padding: {
        top: 32,
        right: 16,
        bottom: 16,
        left: 8,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      line: {
        fill: true,
        tension: 0.4,
      },
    },
  };

  const averageDamage = average?.damage.averageForAll[0]?.avg;
  const averageDamageSelf = average?.damage.averageForUser[0]?.avg;
  const averageHealing = average?.healing.averageForAll[0]?.avg;
  const averageHealingSelf = average?.healing.averageForUser[0]?.avg;
  const averageTanking = average?.tanking.averageForAll[0]?.avg;
  const averageTankingSelf = average?.tanking.averageForUser[0]?.avg;

  const dataStats = {
    labels: gameData.map((stats) => {
      const date = new Date(stats.createdAt);
      return date.toLocaleString(); // You can specify the locale and options if needed
    }),
    datasets: [
      {
        label: t('stats.damageDealt'),
        data: gameData.map((stats, index) => ({
          x: index + 1,
          y: stats.damage,
        })),
        borderColor: 'rgb(255, 0, 0)',
        backgroundColor: 'rgba(255, 0, 0, 0.313)',
        datalabels: {
          color: 'white',
          backgroundColor: 'black',
          display: 'auto',
        },
        hidden: characterCategories[character] !== 'Firepower',
      },
      {
        label: t('stats.averageDamageForAll'),
        data: gameData.map((_, index) => ({
          x: index + 1,
          y: averageDamage,
        })),
        borderColor: 'rgb(128, 2, 2)',
        backgroundColor: 'rgba(128, 0, 0, 0.313)',
        datalabels: {
          color: 'white',
          backgroundColor: 'black',
          display: false,
        },
        hidden: characterCategories[character] !== 'Firepower',
      },
      {
        label: t('stats.averageDamageForSelf'),
        data: gameData.map((_, index) => ({
          x: index + 1,
          y: averageDamageSelf,
        })),
        borderColor: 'rgb(191, 2, 2)',
        backgroundColor: 'rgba(191, 0, 0, 0.313)',
        datalabels: {
          color: 'white',
          backgroundColor: 'black',
          display: false,
        },
        hidden: characterCategories[character] !== 'Firepower',
      },
      {
        label: t('stats.healingDone'),
        data: gameData.map((stats, index) => ({
          x: index + 1,
          y: stats.healing,
        })),
        borderColor: 'rgb(0, 255, 76)',
        backgroundColor: 'rgba(0, 255, 76, 0.313)',
        datalabels: {
          color: 'white',
          backgroundColor: 'black',
          display: 'auto',
        },
        hidden: characterCategories[character] !== 'Support',
      },
      {
        label: t('stats.averageHealingForAll'),
        data: gameData.map((_, index) => ({
          x: index + 1,
          y: averageHealing,
        })),
        borderColor: 'rgb(2, 151, 47)',
        backgroundColor: 'rgba(2, 151, 47, 0.313)',
        datalabels: {
          color: 'white',
          backgroundColor: 'black',
          display: false,
        },
        hidden: characterCategories[character] !== 'Support',
      },
      {
        label: t('stats.averageHealingForSelf'),
        data: gameData.map((_, index) => ({
          x: index + 1,
          y: averageHealingSelf,
        })),
        borderColor: 'rgb(4, 190, 60)',
        backgroundColor: 'rgba(4, 190, 60, 0.313)',
        datalabels: {
          color: 'white',
          backgroundColor: 'black',
          display: false,
        },
        hidden: characterCategories[character] !== 'Support',
      },
      {
        label: t('stats.damageReceived'),
        data: gameData.map((stats, index) => ({
          x: index + 1,
          y: stats.damage_received,
        })),
        borderColor: 'rgb(43, 0, 255)',
        backgroundColor: 'rgba(43, 0, 255, 0.313)',
        datalabels: {
          color: 'white',
          backgroundColor: 'black',
          display: 'auto',
        },
        hidden: characterCategories[character] !== 'Frontline',
      },
      {
        label: t('stats.averageTankingForAll'),
        data: gameData.map((_, index) => ({
          x: index + 1,
          y: averageTanking,
        })),
        borderColor: 'rgb(25, 2, 143)',
        backgroundColor: 'rgba(25, 2, 143, 0.313)',
        datalabels: {
          color: 'white',
          backgroundColor: 'black',
          display: false,
        },
        hidden: characterCategories[character] !== 'Frontline',
      },
      {
        label: t('stats.averageTankingForSelf'),
        data: gameData.map((_, index) => ({
          x: index + 1,
          y: averageTankingSelf,
        })),
        borderColor: 'rgb(33, 3, 184)',
        backgroundColor: 'rgba(33, 3, 184, 0.313)',
        datalabels: {
          color: 'white',
          backgroundColor: 'black',
          display: false,
        },
        hidden: characterCategories[character] !== 'Frontline',
      },
      {
        label: t('stats.deaths'),
        data: gameData.map((stats, index) => ({
          x: index + 1,
          y: stats.deaths,
        })),
        borderColor: 'rgb(208, 255, 0)',
        backgroundColor: 'rgba(208, 255, 0, 0.313)',
        datalabels: {
          color: 'white',
          backgroundColor: 'black',
          display: 'auto',
        },
        hidden: true,
      },
    ],
  };

  useEffect(() => {
    async function fetchData() {
      const data = await fetchInfo(map, player, character);
      const fetchAverage = await getAverage(map, player, character);
      setGameData(data);
      // @ts-ignore
      setAverage(fetchAverage);
    }
    setGameData([]);
    setAverage(undefined);
    fetchData();
  }, [character, map, player]);
  return (
    <div>
      {/*
        // @ts-ignore */}
      <Line options={options} data={dataStats} height={500} />
    </div>
  );
}
