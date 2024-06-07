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
import { useTranslation } from 'react-i18next';
import { truncateDynamicPath } from './SettingsPage';
import DiscordPage from './DiscordPage';

function LinearProgressWithLabel(
  props: LinearProgressProps & {
    value: number;
    text: string;
    bytes: number;
    totalbytes: number;
    t: any;
  },
) {
  const pathString = props.text;
  const pathArray = pathString.split('\\');
  const filenameWithExtension = pathArray[pathArray.length - 1];
  return (
    <>
      <Typography variant="body2" color="text.secondary">
        {props.bytes === 0 && props.totalbytes === 0
          ? props.t('download.checkingfiles')
          : props.t('download.downloading')}{' '}
        {filenameWithExtension}{' '}
        {(props.bytes !== 0 && props.totalbytes !== 0) ??
          `${props.t('download.to')}} ${truncateDynamicPath(props.text, 45)}`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" color="text.secondary">
            {`${Math.round(props.value)}%`} {(props.bytes / 1000000).toFixed(3)}
            /{(props.totalbytes / 1000000).toFixed(3)}{' '}
            {props.t('download.megaBytes')}
          </Typography>
        </Box>
      </Box>
    </>
  );
}

function DownloadPage() {
  const {
    folderPath,
    setFolderPath,
    isDownloading,
    setIsDownloading,
    setExePath,
    discordId,
  } = EvosStore();
  const [progressFile, setProgressFile] = useState('');
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [completed, setCompleted] = useState('');
  const { t } = useTranslation();

  async function handleSelectFolderClick() {
    let path = await window.electron?.ipcRenderer?.getSelectedFolder();
    // replace path:\AtlasReactor if it exists
    path = path.replace(/AtlasReactor/gi, '');
    setFolderPath(path || '');
  }
  function handleDownloadClick() {
    if (isDownloading) {
      window.electron?.ipcRenderer?.cancelDownloadGame();
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
    window.electron?.ipcRenderer?.downloadGame(folderPath);
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
    setExePath(`${folderPath}\\AtlasReactor\\Win64\\AtlasReactor.exe`);
  }

  if (discordId === 0) {
    return <DiscordPage />;
  }

  window.electron?.ipcRenderer?.on('download-progress', handleProgressBar);
  window.electron?.ipcRenderer?.on(
    'download-progress-completed',
    handleComplete,
  );
  return (
    <>
      <Alert severity="info">
        {t('download.infoLine1')} <br />
        {t('download.infoLine2')} <br />
        {t('download.infoLine3')} <br />
        {t('download.infoLine4')} <br />
        {t('download.infoLine5')} <br />
        {t('download.infoLine6')}
      </Alert>
      {isDownloading && (
        <Alert severity="warning">
          {t('download.warningLine1')} <br />
          {t('download.warningLine2')} <br />
          {t('download.warningLine3')}
        </Alert>
      )}
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={7}>
            <TextField
              placeholder={t('download.placeholder')}
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
              {t('download.selectFolder')}
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
              {isDownloading ? t('download.cancel') : t('download.start')}
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
                  t={t}
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
