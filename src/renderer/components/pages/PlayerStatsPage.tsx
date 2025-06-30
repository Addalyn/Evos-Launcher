/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */

/**
 * @fileoverview PlayerStatsPage component for displaying comprehensive player statistics
 *
 * This component provides a detailed view of player statistics including:
 * - Player profile information with avatar and basic stats
 * - Tabbed interface for different game maps
 * - Monthly game statistics and win rates
 * - Character-specific performance data
 * - Faction allegiance information
 *
 * @author Evos Launcher Team
 * @version 1.0.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Tab,
  Tabs,
  Typography,
  Grid,
  Skeleton,
} from '@mui/material';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import EvosStore from 'renderer/lib/EvosStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlayerData, getPlayerData, logout } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';
import { useTranslation } from 'react-i18next';
import GamesPlayedMontly from '../stats-unified/GamesPlayedMontly';
import GamesPlayedCharacter from '../stats-unified/GamesPlayedCharacter';
import PlayerStats from '../stats-unified/PlayerStats';
import GamesWinsMontly from '../stats-unified/GamesWinsMontly';
import Player from '../atlas/Player';
import GamesPlayedStats from '../stats-unified/GamesPlayedStats';
import PlayerWinRate from '../stats-unified/PlayerStatsWinRate';
import ErrorDialog from '../generic/ErrorDialog';
import DiscordPage from './DiscordPage';
import ApiVersionToggle from '../generic/ApiVersionToggle';

/**
 * Props interface for the CustomTabPanel component
 */
interface TabPanelProps {
  /** The content to be displayed within the tab panel */
  children: React.ReactNode;
  /** The index of this tab panel */
  index: number;
  /** The currently active tab value */
  value: number;
}

/**
 * A custom tab panel component that conditionally renders content based on the active tab
 * @param props - The tab panel properties
 * @returns JSX element representing the tab panel
 */
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

/**
 * Generates accessibility properties for tab elements
 * @param index - The index of the tab
 * @returns Object containing accessibility properties for the tab
 */
function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

/**
 * Read-only interface extending URLSearchParams to prevent mutation operations
 */
interface ReadOnlyURLSearchParams extends URLSearchParams {
  append: never;
  set: never;
  delete: never;
  sort: never;
}

/**
 * PlayerStatsPage component displays comprehensive player statistics including
 * games played, win rates, character stats, and faction data across different maps
 *
 * Features:
 * - Player profile display with avatar and basic info
 * - Tabbed interface for different map statistics
 * - Real-time data fetching and error handling
 * - Discord integration check
 * - Responsive design with skeleton loading states
 *
 * @returns JSX element representing the player statistics page
 */
export default function PlayerStatsPage() {
  /** Currently active tab index */
  const [value, setValue] = useState(0);

  /** Search string for the player to display stats for */
  const [playerSearch, setPlayerSearch] = useState('');

  /** Player data retrieved from the API */
  const [playerData, setPlayerData] = useState<PlayerData>();

  /** Current window dimensions for responsive design */
  const { width } = useWindowDimensions();

  /** Application store containing user authentication data */
  const {
    activeUser,
    updateAuthenticatedUsers,
    discordId,
    apiVersion,
    followedPlayers,
    addFollowedPlayer,
    removeFollowedPlayer,
  } = EvosStore();

  /** URL search parameters from the current location */
  const { search } = useLocation();

  /** Error state for displaying error dialogs */
  const [error, setError] = useState<EvosError>();

  /** React Router navigation function */
  const navigate = useNavigate();

  /** Translation function for internationalization */
  const { t } = useTranslation();

  /** Memoized search parameters to prevent unnecessary re-renders */
  const searchParams = useMemo(
    () => new URLSearchParams(search) as ReadOnlyURLSearchParams,
    [search],
  );

  /**
   * Effect to initialize player search based on URL parameters or active user
   * Sets the player search to either the URL parameter or the current user's handle
   */
  useEffect(() => {
    if (searchParams.get('player') === null) {
      setPlayerSearch(activeUser?.handle || '');
    } else {
      setPlayerSearch(searchParams.get('player') as string);
    }
  }, [searchParams, activeUser]);

  /** Calculated drawer width for responsive tab display */
  const drawerWidth =
    width !== null && width < 916
      ? window.innerWidth - 100
      : window.innerWidth - 300;

  /**
   * Handles tab change events
   * @param event - The synthetic event triggered by tab change
   * @param newValue - The index of the newly selected tab
   */
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  /**
   * Effect to fetch player data when playerSearch changes
   * Handles authentication, data fetching, error processing, and logout scenarios
   */
  useEffect(() => {
    if (playerSearch === '') {
      return;
    }

    /**
     * Handles user logout when authentication fails
     * Clears user data and redirects to login page
     */
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

    // Fetch player data and handle response/errors
    getPlayerData(activeUser?.token ?? '', playerSearch)
      // eslint-disable-next-line promise/always-return
      .then((resp) => {
        resp.data.status = resp.data.titleId as unknown as string;
        setPlayerData(resp.data);
      })
      .catch((e) => processError(e, setError, navigate, handleLogOut, t));
  }, [playerSearch, activeUser, navigate, updateAuthenticatedUsers, t]);

  /** Available map options for the tabbed interface */
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

  // Early returns for specific states
  if (discordId === 0) {
    return <DiscordPage />;
  }

  if (playerSearch === '') {
    return null;
  }

  /** Check if the current player is followed */
  const isFollowed = followedPlayers.includes(playerSearch);

  /** Handle follow/unfollow action */
  const handleFollowToggle = () => {
    if (isFollowed) {
      removeFollowedPlayer(playerSearch);
    } else {
      addFollowedPlayer(playerSearch);
    }
  };

  return (
    <>
      {error && (
        <ErrorDialog error={error} onDismiss={() => setError(undefined)} />
      )}

      {/* API Version Toggle */}
      <ApiVersionToggle />

      {/* Player Information Section */}
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          padding: '1em',
        }}
      >
        {/* Player Profile and Follow Button */}
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={8}>
            {!playerData ? (
              <Skeleton
                variant="rectangular"
                width={240}
                height={52}
                style={{ display: 'inline-block', marginLeft: '4px' }}
              />
            ) : (
              <Player
                info={playerData}
                disableSkew
                characterType={undefined}
                titleOld=""
              />
            )}
          </Grid>
          <Grid
            item
            xs={4}
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            {playerSearch && playerSearch !== activeUser?.handle && (
              <Button
                variant="contained"
                color={isFollowed ? 'secondary' : 'primary'}
                onClick={handleFollowToggle}
              >
                {isFollowed
                  ? t('menuOptions.Unfollow')
                  : t('menuOptions.Follow')}
              </Button>
            )}
          </Grid>
        </Grid>

        {/* Player Statistics Grid */}
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <PlayerStats
              action="totaltakedowns"
              player={playerSearch}
              apiVersion={apiVersion}
            />
          </Grid>
          <Grid item xs={4}>
            <PlayerStats
              action="totaldeaths"
              player={playerSearch}
              apiVersion={apiVersion}
            />
          </Grid>
          <Grid item xs={4}>
            <PlayerStats
              action="totaldeathblows"
              player={playerSearch}
              apiVersion={apiVersion}
            />
          </Grid>
          <Grid item xs={4}>
            <PlayerStats
              action="totaldamage"
              player={playerSearch}
              apiVersion={apiVersion}
            />
          </Grid>
          <Grid item xs={4}>
            <PlayerStats
              action="totalhealing"
              player={playerSearch}
              apiVersion={apiVersion}
            />
          </Grid>
          <Grid item xs={4}>
            <PlayerStats
              action="totaldamagereceived"
              player={playerSearch}
              apiVersion={apiVersion}
            />
          </Grid>
          <PlayerWinRate player={playerSearch} apiVersion={apiVersion} />

          {/* Faction Data */}
          <Grid item xs={4}>
            Omni:{' '}
            {!playerData ? (
              <Skeleton
                variant="text"
                width={50}
                style={{ display: 'inline-block', marginLeft: '4px' }}
              />
            ) : (
              playerData?.factionData?.factions[0]
            )}
          </Grid>
          <Grid item xs={4}>
            Evos:{' '}
            {!playerData ? (
              <Skeleton
                variant="text"
                width={50}
                style={{ display: 'inline-block', marginLeft: '4px' }}
              />
            ) : (
              playerData?.factionData?.factions[1]
            )}
          </Grid>
          <Grid item xs={4}>
            Warbotics:{' '}
            {!playerData ? (
              <Skeleton
                variant="text"
                width={50}
                style={{ display: 'inline-block', marginLeft: '4px' }}
              />
            ) : (
              playerData?.factionData?.factions[2]
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Map Statistics Section */}
      <Paper
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          margin: '1em',
          paddingBottom: '0px',
        }}
      >
        {/* Map Tabs */}
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

        {/* Games Played Monthly Charts */}
        {mapTabs.map((map, index) => (
          <CustomTabPanel key={index} value={value} index={index}>
            <GamesPlayedMontly
              key={`games-played-monthly-${map}-${apiVersion}`}
              map={map}
              player={playerSearch}
              apiVersion={apiVersion}
            />
          </CustomTabPanel>
        ))}

        {/* Games Wins Monthly Charts */}
        {mapTabs.map((map, index) => (
          <CustomTabPanel key={index} value={value} index={index}>
            <GamesWinsMontly
              key={`games-wins-monthly-${map}-${apiVersion}`}
              map={map}
              player={playerSearch}
              apiVersion={apiVersion}
            />
          </CustomTabPanel>
        ))}

        {/* Games Played by Character Charts */}
        {mapTabs.map((map, index) => (
          <CustomTabPanel key={index} value={value} index={index}>
            <GamesPlayedCharacter
              key={`games-played-character-${map}-${apiVersion}`}
              map={map}
              player={playerSearch}
              apiVersion={apiVersion}
            />
          </CustomTabPanel>
        ))}

        {/* Games Played Statistics */}
        {mapTabs.map((map, index) => (
          <CustomTabPanel key={index} value={value} index={index}>
            <GamesPlayedStats
              key={`games-played-stats-${map}-${apiVersion}`}
              map={map}
              player={playerSearch}
              apiVersion={apiVersion}
            />
          </CustomTabPanel>
        ))}
      </Paper>
    </>
  );
}
