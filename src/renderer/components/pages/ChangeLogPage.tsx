import React, { useState } from 'react';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import ContributorCommitMessages from '../generic/ContributorCommitMessages';

/**
 * Props for the CustomTabPanel component
 */
interface TabPanelProps {
  /** Content to be displayed within the tab panel */
  children: React.ReactNode;
  /** The index of this tab panel */
  index: number;
  /** The currently active tab value */
  value: number;
}

/**
 * A custom tab panel component that renders content when its index matches the active value
 *
 * @param props - The tab panel properties
 * @returns A tab panel div element with conditional content rendering
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
 * Configuration for changelog tabs
 */
interface ChangelogTab {
  /** Display label for the tab */
  label: string;
  /** GitHub username for the repository owner */
  username: string;
  /** Repository name */
  repo: string;
}

/**
 * Configuration for all changelog tabs
 */
const CHANGELOG_TABS: ChangelogTab[] = [
  { label: 'Evos Launcher', username: 'Addalyn', repo: 'Evos-Launcher' },
  { label: 'Evos', username: 'Zheneq', repo: 'Evos' },
  { label: 'HC', username: 'Zheneq', repo: 'HC' },
];

/**
 * A page component that displays changelog information for multiple repositories
 * Uses tabs to switch between different project changelogs
 *
 * @returns The changelog page with tabbed interface
 */
function ChangeLogPage() {
  const [activeTab, setActiveTab] = useState(0);

  /**
   * Handles tab change events
   *
   * @param event - The synthetic event from the tab click
   * @param newValue - The index of the newly selected tab
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Repository changelog tabs"
        >
          {CHANGELOG_TABS.map((tab, index) => (
            <Tab key={tab.repo} label={tab.label} id={`tab-${index}`} />
          ))}
        </Tabs>
      </Paper>

      {CHANGELOG_TABS.map((tab, index) => (
        <CustomTabPanel key={tab.repo} value={activeTab} index={index}>
          <Paper elevation={3}>
            <ContributorCommitMessages
              username={tab.username}
              repo={tab.repo}
            />
          </Paper>
        </CustomTabPanel>
      ))}
    </>
  );
}

export default ChangeLogPage;
