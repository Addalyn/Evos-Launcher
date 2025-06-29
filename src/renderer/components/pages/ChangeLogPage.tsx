import React, { useState } from 'react';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import ContributorCommitMessages from '../generic/ContributorCommitMessages';

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

function ChangeLogPage() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
          value={value}
          onChange={handleChange}
          aria-label="Repository tabs"
        >
          <Tab label="Evos Launcher" />
          <Tab label="Evos" />
          <Tab label="HC" />
        </Tabs>
      </Paper>
      <CustomTabPanel value={value} index={0}>
        <Paper elevation={3}>
          <ContributorCommitMessages username="Addalyn" repo="Evos-Launcher" />
        </Paper>
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <Paper elevation={3}>
          <ContributorCommitMessages username="Zheneq" repo="Evos" />
        </Paper>
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <Paper elevation={3}>
          <ContributorCommitMessages username="Zheneq" repo="HC" />
        </Paper>
      </CustomTabPanel>
    </>
  );
}

export default ChangeLogPage;
