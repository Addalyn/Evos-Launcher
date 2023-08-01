/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-props-no-spreading */
import { useState } from 'react';

import {
  Avatar,
  Button,
  Grid,
  InputAdornment,
  Paper,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import LinearProgress, {
  LinearProgressProps,
} from '@mui/material/LinearProgress';
import { logoSmall } from 'renderer/lib/Resources';
import EvosStore from 'renderer/lib/EvosStore';
import { truncateDynamicPath } from './SettingsPage';

function LinearProgressWithLabel(
  props: LinearProgressProps & {
    value: number;
    text: string;
    bytes: number;
    totalbytes: number;
  }
) {
  const pathString = props.text;
  const pathArray = pathString.split('\\');
  const filenameWithExtension = pathArray[pathArray.length - 1];
  return (
    <>
      <Typography variant="body2" color="text.secondary">
        {props.bytes === 0 && props.totalbytes === 0
          ? 'Checking file'
          : 'Downloading'}{' '}
        {filenameWithExtension}{' '}
        {(props.bytes !== 0 && props.totalbytes !== 0) ??
          `To ${truncateDynamicPath(props.text, 45)}`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">
            {`${Math.round(props.value)}%`} {(props.bytes / 1000000).toFixed(3)}
            /{(props.totalbytes / 1000000).toFixed(3)} MB
          </Typography>
        </Box>
      </Box>
    </>
  );
}

function DownloadPage() {
  const { folderPath, setFolderPath, isDownloading, setIsDownloading } =
    EvosStore();
  const [progressFile, setProgressFile] = useState('');
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [completed, setCompleted] = useState('');
  async function handleSelectFolderClick() {
    const path = await window.electron.ipcRenderer.getSelectedFolder();

    setFolderPath(path || '');
  }
  function handleDownloadClick() {
    if (isDownloading) {
      window.electron.ipcRenderer.cancelDownloadGame();
      setCompleted('');
      setIsDownloading(false);
      setProgressFile('');
      setProgress(0);
      setBytes(0);
      setTotalBytes(0);
      return;
    }

    setCompleted('');
    setIsDownloading(true);
    window.electron.ipcRenderer.downloadGame(folderPath);
  }

  function handleProgressBar(event: any) {
    setProgressFile(event.filePath);
    setProgress(event.percent);
    setBytes(event.bytes);
    setTotalBytes(event.totalBytes);
  }

  function handleComplete(event: any) {
    setIsDownloading(false);
    setCompleted(event.text);
  }

  window.electron.ipcRenderer.on('download-progress', handleProgressBar);
  window.electron.ipcRenderer.on('download-progress-completed', handleComplete);
  return (
    <>
      <Alert severity="info">
        Preferably, download the game from Steam or any other official source.{' '}
        <br />
        Please consider this option as a last resort, as it is provided &apos;as
        is&apos; and may cease to work at any time. <br />
        To access, you must authenticate with Discord, be in our server, and
        have the correct role.
      </Alert>
      {isDownloading && (
        <Alert severity="warning">
          Please wait until all files are checked and downloaded before
          proceeding. <br />
          It may appear frozen, but it&apos;s not. <br />
          You can restart Evos Launcher, and it will simply verify existing
          files before continuing.
        </Alert>
      )}
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={7}>
            <TextField
              placeholder="Atlas Reactor download path"
              value={truncateDynamicPath(folderPath, 45)}
              style={{ flexGrow: 1, marginRight: '1em' }}
              variant="outlined"
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Avatar
                      alt="logo"
                      variant="square"
                      src={logoSmall()}
                      sx={{
                        flexShrink: 1,
                        width: 40,
                        height: 40,
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={5}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleSelectFolderClick()}
              fullWidth
              disabled={isDownloading}
              sx={{
                height: '56px',
                backgroundColor: (theme) => theme.palette.primary.light,
              }}
            >
              Select Folder
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleDownloadClick()}
              fullWidth
              disabled={folderPath === ''}
              sx={{
                height: '56px',
                backgroundColor: (theme) =>
                  isDownloading
                    ? theme.palette.error.dark
                    : theme.palette.primary.light,
              }}
            >
              {isDownloading
                ? 'Cancel Download or repair'
                : 'Download or repair Atlas Reactor'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {(progressFile !== '' || completed !== '') && (
        <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              {completed === '' && progressFile !== '' ? (
                <LinearProgressWithLabel
                  value={progress}
                  text={progressFile}
                  bytes={bytes}
                  totalbytes={totalBytes}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {completed}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}
    </>
  );
}

export default DownloadPage;
