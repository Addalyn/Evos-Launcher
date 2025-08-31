/**
 * @fileoverview Game download page component for the Evos Launcher
 * Handles game installation, download progress tracking, and file management.
 * Provides user interface for selecting download location and monitoring download status.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

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
import { withElectron } from 'renderer/utils/electronUtils';
import DiscordPage from './DiscordPage';
import { truncateDynamicPath } from 'renderer/utils/pathUtils';

/**
 * Translation function type
 */
type TranslationFunction = (key: string) => string;

/**
 * Download progress event data
 */
interface DownloadProgressEvent {
  filePath: string;
  percent: number;
  bytes: number;
  totalBytes: number;
}

/**
 * Download completion event data
 */
interface DownloadCompleteEvent {
  text: string;
}

/**
 * Props for LinearProgressWithLabel component
 */
interface LinearProgressWithLabelProps extends LinearProgressProps {
  value: number;
  text: string | null | undefined;
  bytes: number;
  totalbytes: number;
  t: TranslationFunction;
}

/**
 * Linear progress bar component with label showing download progress
 * @param props - Component props including progress value, text, bytes, and translation function
 * @returns JSX element displaying progress bar with download information
 */
function LinearProgressWithLabel(props: LinearProgressWithLabelProps) {
  const { value, text, bytes, totalbytes, t, ...progressProps } = props;

  // Handle empty or undefined text
  if (!text || text.trim() === '') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress
            variant="determinate"
            value={value}
            {...progressProps}
          />
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" color="text.secondary">
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Extract filename from full path
  const pathArray = text ? text.split('\\') : [];
  const filenameWithExtension =
    pathArray.length > 0 ? pathArray[pathArray.length - 1] : '';

  // Determine status text based on progress
  const isChecking = bytes === 0 && totalbytes === 0;
  const statusText = isChecking
    ? t('download.checkingfiles')
    : t('download.downloading');

  return (
    <>
      <Typography variant="body2" color="text.secondary">
        {statusText} {filenameWithExtension}{' '}
        {!isChecking &&
          text &&
          text.trim() !== '' &&
          `${t('download.to')} ${truncateDynamicPath(text, 45)}`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress
            variant="determinate"
            value={value}
            {...progressProps}
          />
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" color="text.secondary">
            {`${Math.round(value)}%`} {(bytes / 1000000).toFixed(3)}/
            {(totalbytes / 1000000).toFixed(3)} {t('download.megaBytes')}
          </Typography>
        </Box>
      </Box>
    </>
  );
}

/**
 * DownloadPage component for handling game downloads
 * Provides UI for selecting download folder, starting/canceling downloads,
 * and displaying download progress
 * @returns JSX element for the download page
 */
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

  /**
   * Handles folder selection for download destination
   * Removes existing AtlasReactor folder from path if present
   */
  const handleSelectFolderClick = async (): Promise<void> => {
    const result = await withElectron(
      (electron) => electron.ipcRenderer.getSelectedFolder(),
      null,
    );

    if (!result) {
      return; // No path selected or not in Electron environment
    }

    // Remove AtlasReactor folder from path if it exists
    const cleanPath = result.replace(/AtlasReactor/gi, '');
    setFolderPath(cleanPath || '');
  };

  /**
   * Handles download start/cancel button click
   * Toggles download state and resets progress when canceling
   */
  const handleDownloadClick = (): void => {
    if (isDownloading) {
      withElectron((electron) => electron.ipcRenderer.cancelDownloadGame());
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
    withElectron((electron) => electron.ipcRenderer.downloadGame(folderPath));
  };

  /**
   * Handles download progress updates from main process
   * @param event - Progress event containing file path, percentage, and byte information
   */
  const handleProgressBar = (event: DownloadProgressEvent): void => {
    setProgressFile(event.filePath);
    setProgress(event.percent);
    setBytes(event.bytes);
    setTotalBytes(event.totalBytes);
  };

  /**
   * Handles download completion from main process
   * Sets the executable path and completion message
   * @param event - Completion event containing completion text
   */
  const handleComplete = (event: DownloadCompleteEvent): void => {
    setIsDownloading(false);
    setCompleted(event.text);
    setExePath(`${folderPath}\\AtlasReactor\\Win64\\AtlasReactor.exe`);
  };

  /**
   * Wrapper function for IPC progress events
   * @param args - IPC event arguments
   */
  const handleProgressWrapper = (...args: unknown[]): void => {
    const event = args[0] as DownloadProgressEvent;
    handleProgressBar(event);
  };

  /**
   * Wrapper function for IPC completion events
   * @param args - IPC event arguments
   */
  const handleCompleteWrapper = (...args: unknown[]): void => {
    const event = args[0] as DownloadCompleteEvent;
    handleComplete(event);
  };

  // Redirect to Discord page if user is not authenticated
  if (discordId === 0) {
    return <DiscordPage />;
  }

  // Set up IPC listeners for download events
  withElectron((electron) => {
    electron.ipcRenderer.on('download-progress', handleProgressWrapper);
    electron.ipcRenderer.on(
      'download-progress-completed',
      handleCompleteWrapper,
    );
  });

  /**
   * Renders the download page UI with alerts, folder selection, and progress display
   */
  return (
    <>
      {/* Information alert with download instructions */}
      <Alert severity="info">
        {t('download.infoLine1')} <br />
        {t('download.infoLine2')} <br />
        {t('download.infoLine3')} <br />
        {t('download.infoLine4')} <br />
        {t('download.infoLine5')} <br />
        {t('download.infoLine6')}
      </Alert>

      {/* Warning alert shown during download */}
      {isDownloading && (
        <Alert severity="warning">
          {t('download.warningLine1')} <br />
          {t('download.warningLine2')} <br />
          {t('download.warningLine3')}
        </Alert>
      )}

      {/* Folder selection section */}
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
              onClick={handleSelectFolderClick}
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

      {/* Download/Cancel button section */}
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadClick}
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

      {/* Progress/Completion display section */}
      {(progressFile || completed) && (
        <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              {!completed && progressFile ? (
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
