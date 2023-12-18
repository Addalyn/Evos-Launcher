/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Tab, Tabs, Typography, Grid } from '@mui/material';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import EvosStore from 'renderer/lib/EvosStore';
import { useLocation } from 'react-router-dom';
import { PlayerData, getPlayerData } from 'renderer/lib/Evos';
import GamesPlayedMontly from '../stats/GamesPlayedMontly';
import GamesPlayedCharacter from '../stats/GamesPlayedCharacter';
import PlayerStats from '../stats/PlayerStats';
import GamesWinsMontly from '../stats/GamesWinsMontly';
import Player from '../atlas/Player';

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
  const [value2, setValue2] = useState(0);
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerData, setPlayerData] = useState<PlayerData>();
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
  const handleChange2 = (event: React.SyntheticEvent, newValue: number) => {
    setValue2(newValue);
  };

  useEffect(() => {
    if (playerSearch === '') {
      return;
    }
    getPlayerData(activeUser?.token ?? '', playerSearch)
      // eslint-disable-next-line promise/always-return
      .then((resp) => {
        setPlayerData(resp.data);
      })
      .catch(() => setPlayerData(undefined));
  }, [playerSearch, activeUser]);

  const mapTabs = [
    'All Maps',
    'Christmas Cloudspire',
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
        <Player info={playerData} />
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
          <Grid item xs={4}>
            Omni: {playerData?.factionData?.factions[0]}
          </Grid>
          <Grid item xs={4}>
            Evos: {playerData?.factionData?.factions[1]}
          </Grid>
          <Grid item xs={4}>
            Warbotics: {playerData?.factionData?.factions[2]}
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
            <GamesWinsMontly map={map} player={playerSearch} />
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
          value={value2}
          onChange={handleChange2}
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
          <CustomTabPanel key={index} value={value2} index={index}>
            <GamesPlayedCharacter map={map} player={playerSearch} />
          </CustomTabPanel>
        ))}
      </Paper>
    </>
  );
}
