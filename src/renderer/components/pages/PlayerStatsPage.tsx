/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Tab, Tabs, Typography, Grid } from '@mui/material';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import EvosStore from 'renderer/lib/EvosStore';
import { useLocation } from 'react-router-dom';
import GamesPlayedMontly from '../stats/GamesPlayedMontly';
import GamesPlayedCharacter from '../stats/GamesPlayedCharacter';
import PlayerStats from '../stats/PlayerStats';

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

interface ReadOnlyURLSearchParams extends URLSearchParams {
  append: never;
  set: never;
  delete: never;
  sort: never;
}

export default function PlayerStatsPage() {
  const [value, setValue] = useState(0);
  const [value1, setValue1] = useState(0);
  const [playerSearch, setPlayerSearch] = useState('');
  const { width } = useWindowDimensions();
  const { activeUser } = EvosStore();
  const { search } = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(search) as ReadOnlyURLSearchParams,
    [search]
  );

  useEffect(() => {
    if (searchParams.get('player') === null) {
      setPlayerSearch(activeUser?.handle || '');
    } else {
      setPlayerSearch(searchParams.get('player') as string);
    }
  }, [searchParams, activeUser]);

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

  if (playerSearch === '') {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          padding: '1em',
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <PlayerStats action="totaltakedowns" player={playerSearch} />
          </Grid>
          <Grid item xs={4}>
            <PlayerStats action="totaldeaths" player={playerSearch} />
          </Grid>
          <Grid item xs={4}>
            <PlayerStats action="totaldeathblows" player={playerSearch} />
          </Grid>
          <Grid item xs={4}>
            <PlayerStats action="totaldamage" player={playerSearch} />
          </Grid>
          <Grid item xs={4}>
            <PlayerStats action="totalhealing" player={playerSearch} />
          </Grid>
          <Grid item xs={4}>
            <PlayerStats action="totaldamagereceived" player={playerSearch} />
          </Grid>
        </Grid>
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
            <GamesPlayedMontly map={map} player={playerSearch} />
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
            <GamesPlayedCharacter map={map} player={playerSearch} />
          </CustomTabPanel>
        ))}
      </Paper>
    </>
  );
}
