/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Tab, Tabs, Typography, Grid } from '@mui/material';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import EvosStore from 'renderer/lib/EvosStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlayerData, getPlayerData, logout } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';
import { useTranslation } from 'react-i18next';
import GamesPlayedMontly from '../stats/GamesPlayedMontly';
import GamesPlayedCharacter from '../stats/GamesPlayedCharacter';
import PlayerStats from '../stats/PlayerStats';
import GamesWinsMontly from '../stats/GamesWinsMontly';
import Player from '../atlas/Player';
import GamesPlayedStats from '../stats/GamesPlayedStats';
import PlayerWinRate from '../stats/PlayerStatsWinRate';
import ErrorDialog from '../generic/ErrorDialog';
import DiscordPage from './DiscordPage';

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
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerData, setPlayerData] = useState<PlayerData>();
  const { width } = useWindowDimensions();
  const { activeUser, updateAuthenticatedUsers, discordId } = EvosStore();
  const { search } = useLocation();
  const [error, setError] = useState<EvosError>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const searchParams = useMemo(
    () => new URLSearchParams(search) as ReadOnlyURLSearchParams,
    [search],
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
  useEffect(() => {
    if (playerSearch === '') {
      return;
    }
    const handleLogOut = () => {
      logout(activeUser?.token ?? '');
      updateAuthenticatedUsers(
        activeUser?.user as string,
        '',
        activeUser?.handle as string,
        activeUser?.banner as number,
        activeUser?.configFile as string,
      );
      navigate('/login');
    };
    getPlayerData(activeUser?.token ?? '', playerSearch)
      // eslint-disable-next-line promise/always-return
      .then((resp) => {
        resp.data.status = resp.data.titleId as unknown as string;
        setPlayerData(resp.data);
      })
      .catch((e) => processError(e, setError, navigate, handleLogOut, t));
  }, [playerSearch, activeUser, navigate, updateAuthenticatedUsers, t]);

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

  if (discordId === 0) {
    return <DiscordPage />;
  }

  if (playerSearch === '') {
    return <div>{t('loading')}</div>;
  }

  return (
    <>
      {error && (
        <ErrorDialog error={error} onDismiss={() => setError(undefined)} />
      )}
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          padding: '1em',
        }}
      >
        <Player info={playerData} disableSkew />
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
          <PlayerWinRate player={playerSearch} />
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
            <Tab label={t(`maps.${label}`)} key={index} {...a11yProps(index)} />
          ))}
        </Tabs>
        {mapTabs.map((map, index) => (
          <CustomTabPanel key={index} value={value} index={index}>
            <GamesPlayedMontly map={map} player={playerSearch} />
          </CustomTabPanel>
        ))}
        {mapTabs.map((map, index) => (
          <CustomTabPanel key={index} value={value} index={index}>
            <GamesWinsMontly map={map} player={playerSearch} />
          </CustomTabPanel>
        ))}
        {mapTabs.map((map, index) => (
          <CustomTabPanel key={index} value={value} index={index}>
            <GamesPlayedCharacter map={map} player={playerSearch} />
          </CustomTabPanel>
        ))}
        {mapTabs.map((map, index) => (
          <CustomTabPanel key={index} value={value} index={index}>
            <GamesPlayedStats map={map} player={playerSearch} />
          </CustomTabPanel>
        ))}
      </Paper>
    </>
  );
}
