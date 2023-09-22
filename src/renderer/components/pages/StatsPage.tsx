/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import GamesPlayedMontly from '../stats/GamesPlayedMontly';
import GamesPlayedCharacter from '../stats/GamesPlayedCharacter';
import TopGamesPlayedBy from '../stats/TopGamesPlayedBy';

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
            <Tab label={label} key={index} {...a11yProps(index)} />
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
            <Tab label={label} key={index} {...a11yProps(index)} />
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
        <TopGamesPlayedBy />
      </Paper>
    </>
  );
}
