/* eslint-disable import/order */
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';

import GamesPlayedCharacter from '../stats-v1/GamesPlayedCharacter';
import GamesPlayedMontly from '../stats-v1/GamesPlayedMontly';
import GamesPlayedServer from '../stats-v1/GamesPlayedServer';
import TopGamesDamageBy from '../stats-v1/TopGamesDamageBy';
import TopGamesDamageByAvg from '../stats-v1/TopGamesDamageByAvg';
import TopGamesDamageReceivedBy from '../stats-v1/TopGamesDamageReceivedBy';
import TopGamesDamageReceivedByAvg from '../stats-v1/TopGamesDamageReceivedByAvg';
import TopGamesDeathBlowsBy from '../stats-v1/TopGamesDeathBlowsBy';
import TopGamesDeathBlowsByAvg from '../stats-v1/TopGamesDeathBlowsByAvg';
import TopGamesDeathsBy from '../stats-v1/TopGamesDeathsBy';
import TopGamesDeathsByAvgASC from '../stats-v1/TopGamesDeathsByAvgASC';
import TopGamesDeathsByAvgDESC from '../stats-v1/TopGamesDeathsByAvgDESC';
import TopGamesHealedBy from '../stats-v1/TopGamesHealedBy';
import TopGamesHealedByAvg from '../stats-v1/TopGamesHealedByAvg';
import TopGamesPlayedBy from '../stats-v1/TopGamesPlayedBy';
import TopGamesTakeDowns from '../stats-v1/TopGamesTakeDowns';
import TopGamesTakeDownsByAvg from '../stats-v1/TopGamesTakeDownsByAvg';
import { useTranslation } from 'react-i18next';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import EvosStore from 'renderer/lib/EvosStore';
import DiscordPage from './DiscordPage';
import TopGamesHealRecieved from '../stats-v1/TopGamesHealRecieved';
import TopGamesPowerups from '../stats-v1/TopGamesPowerups';
import TopGamesReducedDamageCover from '../stats-v1/TopGamesReducedDamageCover';
import TopGamesExtraDamageFromMight from '../stats-v1/TopGamesExtraDamageFromMight';
import TopGamesReducedDamageFromWeaken from '../stats-v1/TopGamesReducedDamageFromWeaken';
import TopGamesMovementDenied from '../stats-v1/TopGamesMovementDenied';
import TopGamesEnemiesSighted from '../stats-v1/TopGamesEnemiesSighted';
import TopGamesAccoladesCollector from '../stats-v1/TopGamesAccoladesCollector';
import TopGamesPerfectAccolades from '../stats-v1/TopGamesPerfectAccolades';

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...other}
    >
      {value === index && (
        <Box sx={{ padding: '1em', paddingTop: 0 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function StatsPage() {
  const [value, setValue] = useState(0);
  const [value1, setValue1] = useState(0);
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { discordId } = EvosStore();

  if (discordId === 0) {
    return <DiscordPage />;
  }

  const drawerWidth =
    width !== null && width < 916
      ? window.innerWidth - 100
      : window.innerWidth - 300;

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const handleChange1 = (event: React.SyntheticEvent, newValue: number) => {
    setValue1(newValue);
  };
  const mapTabs = [
    'All Maps',
    'Omni Reactor Core',
    'EvoS Labs',
    'Oblivion',
    'Hexcelence',
    'Flyway Freighter',
    'Cloudspire',
    'Hyperforge',
    'Christmas Cloudspire',
  ];

  return (
    <>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="Map Tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ width: drawerWidth }}
        >
          {mapTabs.map((label, index) => (
            <Tab label={t(`maps.${label}`)} key={index} {...a11yProps(index)} />
          ))}
        </Tabs>
        {mapTabs.map((map, index) => (
          <CustomTabPanel key={index} value={value} index={index}>
            <GamesPlayedMontly map={map} player="" />
          </CustomTabPanel>
        ))}
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <Tabs
          value={value1}
          onChange={handleChange1}
          aria-label="Map Tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ width: drawerWidth }}
        >
          {mapTabs.map((label, index) => (
            <Tab label={t(`maps.${label}`)} key={index} {...a11yProps(index)} />
          ))}
        </Tabs>
        {mapTabs.map((map, index) => (
          <CustomTabPanel key={index} value={value1} index={index}>
            <GamesPlayedCharacter map={map} player="" />
          </CustomTabPanel>
        ))}
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <GamesPlayedServer />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesPlayedBy />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesTakeDowns />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesDeathsBy />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesDeathBlowsBy />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesDamageBy />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesHealedBy />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesDamageReceivedBy />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesTakeDownsByAvg />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesDeathsByAvgASC />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesDeathsByAvgDESC />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesDeathBlowsByAvg />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesDamageByAvg />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesHealedByAvg />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesDamageReceivedByAvg />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesHealRecieved />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesPowerups />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesReducedDamageCover />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesExtraDamageFromMight />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesReducedDamageFromWeaken />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesMovementDenied />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesEnemiesSighted />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesAccoladesCollector />
      </Paper>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        <TopGamesPerfectAccolades />
      </Paper>
    </>
  );
}
