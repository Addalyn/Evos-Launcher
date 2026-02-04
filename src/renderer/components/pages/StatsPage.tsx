/* eslint-disable import/order */
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';

import GamesPlayedCharacter from '../stats-unified/GamesPlayedCharacter';
import GamesPlayedMontly from '../stats-unified/GamesPlayedMontly';
import GamesPlayedServer from '../stats-unified/GamesPlayedServer';
import TopGamesDamageBy from '../stats-unified/TopGamesDamageBy';
import TopGamesDamageByAvg from '../stats-unified/TopGamesDamageByAvg';
import TopGamesDamageReceivedBy from '../stats-unified/TopGamesDamageReceivedBy';
import TopGamesDamageReceivedByAvg from '../stats-unified/TopGamesDamageReceivedByAvg';
import TopGamesDeathBlowsBy from '../stats-unified/TopGamesDeathBlowsBy';
import TopGamesDeathBlowsByAvg from '../stats-unified/TopGamesDeathBlowsByAvg';
import TopGamesDeathsBy from '../stats-unified/TopGamesDeathsBy';
import TopGamesDeathsByAvgASC from '../stats-unified/TopGamesDeathsByAvgASC';
import TopGamesDeathsByAvgDESC from '../stats-unified/TopGamesDeathsByAvgDESC';
import TopGamesHealedBy from '../stats-unified/TopGamesHealedBy';
import TopGamesHealedByAvg from '../stats-unified/TopGamesHealedByAvg';
import TopGamesPlayedBy from '../stats-unified/TopGamesPlayedBy';
import TopGamesTakeDowns from '../stats-unified/TopGamesTakeDowns';
import TopGamesTakeDownsByAvg from '../stats-unified/TopGamesTakeDownsByAvg';
import { useTranslation } from 'react-i18next';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import EvosStore from 'renderer/lib/EvosStore';
import DiscordPage from './DiscordPage';
import TopGamesHealRecieved from '../stats-unified/TopGamesHealRecieved';
import TopGamesPowerups from '../stats-unified/TopGamesPowerups';
import TopGamesReducedDamageCover from '../stats-unified/TopGamesReducedDamageCover';
import TopGamesExtraDamageFromMight from '../stats-unified/TopGamesExtraDamageFromMight';
import TopGamesReducedDamageFromWeaken from '../stats-unified/TopGamesReducedDamageFromWeaken';
import TopGamesMovementDenied from '../stats-unified/TopGamesMovementDenied';
import TopGamesEnemiesSighted from '../stats-unified/TopGamesEnemiesSighted';
import TopGamesAccoladesCollector from '../stats-unified/TopGamesAccoladesCollector';
import TopGamesPerfectAccolades from '../stats-unified/TopGamesPerfectAccolades';
import ApiVersionToggle from '../generic/ApiVersionToggle';
import TopGamesQuests from '../stats-unified/TopGamesQuests';

/**
 * Props for the CustomTabPanel component
 */
interface TabPanelProps {
  /** The content to be displayed in the tab panel */
  children: React.ReactNode;
  /** The index of the tab panel */
  index: number;
  /** The currently active tab value */
  value: number;
}

/**
 * A custom tab panel component that displays content based on the active tab
 * @param props - The props for the tab panel
 * @returns A tab panel component
 */
function CustomTabPanel(props: TabPanelProps): React.ReactElement {
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
 * Generates accessibility properties for tab components
 * @param index - The index of the tab
 * @returns An object with accessibility properties
 */
function a11yProps(index: number): { id: string; 'aria-controls': string } {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

/** Available map options for statistics display */
const MAP_TABS = [
  'All Maps',
  'Omni Reactor Core',
  'EvoS Labs',
  'Oblivion',
  'Hexcelence',
  'Flyway Freighter',
  'Cloudspire',
  'Hyperforge',
  'Christmas Cloudspire',
] as const;

/**
 * Statistics page component that displays various game statistics organized in tabs
 * Requires Discord authentication to display content
 * @returns The statistics page component or Discord login page if not authenticated
 */
export default function StatsPage(): React.ReactElement {
  const [value, setValue] = useState<number>(0);
  const [value1, setValue1] = useState<number>(0);
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { discordId, apiVersion } = EvosStore();

  if (discordId === 0) {
    return <DiscordPage />;
  }

  const drawerWidth: number =
    width !== null && width < 916
      ? window.innerWidth - 100
      : window.innerWidth - 300;

  /**
   * Handles tab change for the first tab group (monthly games)
   * @param _event - The synthetic event (unused)
   * @param newValue - The new tab index
   */
  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: number,
  ): void => {
    setValue(newValue);
  };

  /**
   * Handles tab change for the second tab group (character games)
   * @param _event - The synthetic event (unused)
   * @param newValue - The new tab index
   */
  const handleChange1 = (
    _event: React.SyntheticEvent,
    newValue: number,
  ): void => {
    setValue1(newValue);
  };

  const mapTabs = MAP_TABS;

  /**
   * Renders a paper container with consistent styling
   * @param children - The content to render inside the paper
   * @returns A styled Paper component
   */
  const renderPaperContainer = (
    children: React.ReactNode,
  ): React.ReactElement => (
    <Paper
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        margin: '1em',
        paddingBottom: '0px',
      }}
    >
      {children}
    </Paper>
  );

  /**
   * Renders a tab group with map selection
   * @param tabValue - The current tab value
   * @param onChange - The change handler for tab selection
   * @param renderContent - Function to render content for each map
   * @returns A tab group component
   */
  const renderMapTabs = (
    tabValue: number,
    onChange: (event: React.SyntheticEvent, newValue: number) => void,
    renderContent: (map: string, index: number) => React.ReactNode,
  ): React.ReactElement => (
    <>
      <Tabs
        value={tabValue}
        onChange={onChange}
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
        <CustomTabPanel key={index} value={tabValue} index={index}>
          {renderContent(map, index)}
        </CustomTabPanel>
      ))}
    </>
  );

  return (
    <>
      <ApiVersionToggle />
      {renderPaperContainer(
        renderMapTabs(value, handleChange, (map) => (
          <GamesPlayedMontly map={map} player="" apiVersion={apiVersion} />
        )),
      )}
      {renderPaperContainer(
        renderMapTabs(value1, handleChange1, (map) => (
          <GamesPlayedCharacter map={map} player="" apiVersion={apiVersion} />
        )),
      )}
      {renderPaperContainer(<GamesPlayedServer apiVersion={apiVersion} />)}
      {renderPaperContainer(<TopGamesPlayedBy apiVersion={apiVersion} />)}
      {renderPaperContainer(<TopGamesTakeDowns apiVersion={apiVersion} />)}
      {renderPaperContainer(<TopGamesDeathsBy apiVersion={apiVersion} />)}
      {renderPaperContainer(<TopGamesDeathBlowsBy apiVersion={apiVersion} />)}
      {renderPaperContainer(<TopGamesDamageBy apiVersion={apiVersion} />)}
      {renderPaperContainer(<TopGamesHealedBy apiVersion={apiVersion} />)}
      {renderPaperContainer(
        <TopGamesDamageReceivedBy apiVersion={apiVersion} />,
      )}
      {renderPaperContainer(<TopGamesTakeDownsByAvg apiVersion={apiVersion} />)}
      {renderPaperContainer(<TopGamesDeathsByAvgASC apiVersion={apiVersion} />)}
      {renderPaperContainer(
        <TopGamesDeathsByAvgDESC apiVersion={apiVersion} />,
      )}
      {renderPaperContainer(
        <TopGamesDeathBlowsByAvg apiVersion={apiVersion} />,
      )}
      {renderPaperContainer(<TopGamesDamageByAvg apiVersion={apiVersion} />)}
      {renderPaperContainer(<TopGamesHealedByAvg apiVersion={apiVersion} />)}
      {renderPaperContainer(
        <TopGamesDamageReceivedByAvg apiVersion={apiVersion} />,
      )}
      {renderPaperContainer(<TopGamesHealRecieved apiVersion={apiVersion} />)}
      {renderPaperContainer(<TopGamesPowerups apiVersion={apiVersion} />)}
      {renderPaperContainer(
        <TopGamesReducedDamageCover apiVersion={apiVersion} />,
      )}
      {renderPaperContainer(
        <TopGamesExtraDamageFromMight apiVersion={apiVersion} />,
      )}
      {renderPaperContainer(
        <TopGamesReducedDamageFromWeaken apiVersion={apiVersion} />,
      )}
      {renderPaperContainer(<TopGamesMovementDenied apiVersion={apiVersion} />)}
      {renderPaperContainer(<TopGamesEnemiesSighted apiVersion={apiVersion} />)}
      {renderPaperContainer(
        <TopGamesAccoladesCollector apiVersion={apiVersion} />,
      )}
      {renderPaperContainer(
        <TopGamesPerfectAccolades apiVersion={apiVersion} />,
      )}
      {renderPaperContainer(
        <TopGamesQuests apiVersion={apiVersion} />,
      )}
    </>
  );
}
