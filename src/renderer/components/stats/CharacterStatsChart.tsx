/* eslint-disable import/order */
import 'chart.js/auto';

import { Grid, Typography } from '@mui/material';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';

import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import { Bar } from 'react-chartjs-2';
import CharacterStatsChartLine from './CharacterStatsChartLine';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import PlayerWinRate from './PlayerStatsWinRate';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', {
  color: 'white',
  display: false,
});

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&:before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, .05)'
      : 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

interface CharacterStats {
  category: string;
  user: string;
  character: string;
  total_damage: number;
  total_healing: number;
  total_deathblows: number;
  total_damage_received: number;
  total_takedowns: number;
  total_games: string;
  total_deaths: number;
}

interface CharacterChartProps {
  characterData: CharacterStats;
  chartLabels: string[];
  chartColors: string[];
}

function CharacterChart({
  characterData,
  chartLabels,
  chartColors,
}: CharacterChartProps) {
  const { t } = useTranslation();

  const chartData = {
    labels: chartLabels.map((label) => t(label)),
    datasets: [
      {
        label: characterData.character,
        data: chartLabels.map(
          (label) =>
            characterData[label.toLowerCase() as keyof CharacterStats] || 0,
        ),
        backgroundColor: chartColors,
        borderColor: chartColors.map((color) => `${color}1`),
        borderWidth: 1,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        display: true,
      },
      x: {
        display: true,
      },
    },
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        display: true,
        formatter: (value: number) => {
          return value.toLocaleString('en-US');
        },
      },
    },
    hover: {
      animationDuration: 0,
    },
  };

  const chartKey = `${characterData.character}-${chartLabels.join('-')}`;
  // @ts-ignore
  return <Bar key={chartKey} data={chartData} options={chartOptions} />;
}

interface CharacterStatsChartProps {
  data: CharacterStats[];
  player: string;
  map: string;
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
  'Lex',
  'Lockwood',
  'NEV:3',
  'Nix',
  'OZ',
  'PuP',
  'Tol-Ren',
  'Vonn',
  'Zuki',
  /* Frontline */
  'Asana',
  'Brynn',
  'Garrison',
  'Isadora',
  'Magnus',
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
  Isadora: 'Frontline',
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

function CharacterStatsChart({ data, player, map }: CharacterStatsChartProps) {
  const { t } = useTranslation();

  const charactersByType = names.reduce((acc, character) => {
    const type = characterCategories[character];
    if (!acc[type as keyof typeof charactersByType]) {
      // @ts-ignore
      acc[type as keyof typeof charactersByType] = [];
    }
    (acc[type as keyof typeof charactersByType] as string[]).push(character);
    return acc;
  }, {});

  const orderedTypes = ['Firepower', 'Frontline', 'Support'];

  const sortedCharacters = orderedTypes.flatMap(
    (type) => charactersByType[type as keyof typeof charactersByType],
  );

  const sortedData = sortedCharacters.map((character) => {
    const characterData = data.find((item) => item.character === character);
    if (characterData !== undefined)
      characterData.category = characterCategories[character];
    return characterData || null;
  });

  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChangeAccordion =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <div>
      {sortedData.map(
        (characterData, index) =>
          characterData !== null && (
            <Accordion
              key={index}
              expanded={expanded === `panel${index}`}
              onChange={handleChangeAccordion(`panel${index}`)}
            >
              <AccordionSummary>
                <Typography
                  variant="h6"
                  sx={{ color: categoryColors[characterData.category] }}
                  style={{ flex: 1 }} // Set the name to take up remaining space
                >
                  {t(`charNames.${characterData.character.replace(/:3/g, '')}`)}
                </Typography>
                <div
                  style={{
                    width: '50%',
                    color: categoryColors[characterData.category],
                  }}
                >
                  <Grid container>
                    <PlayerWinRate
                      characterName={characterData.character}
                      player={player}
                      map={map}
                    />
                  </Grid>
                </div>
              </AccordionSummary>
              {expanded === `panel${index}` && (
                <AccordionDetails>
                  <div
                    className="chart-container"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ width: '100%' }}>
                      <CharacterChart
                        characterData={characterData}
                        chartLabels={[
                          'total_damage',
                          'total_damage_received',
                          'total_healing',
                        ]}
                        chartColors={[
                          'rgba(255,99,132,0.6)',
                          'rgba(54,162,235,0.6)',
                          'rgba(75,192,192,0.6)',
                        ]}
                      />
                    </div>
                    <div style={{ width: '100%' }}>
                      <CharacterChart
                        characterData={characterData}
                        chartLabels={[
                          'total_deathblows',
                          'total_takedowns',
                          'total_deaths',
                        ]}
                        chartColors={[
                          'rgba(255,205,86,0.6)',
                          'rgba(153,102,255,0.6)',
                          'rgba(255,159,64,0.6)',
                        ]}
                      />
                    </div>
                  </div>
                  <CharacterStatsChartLine
                    character={characterData.character}
                    player={player}
                    map={map}
                  />
                </AccordionDetails>
              )}
            </Accordion>
          ),
      )}
    </div>
  );
}

export default CharacterStatsChart;
