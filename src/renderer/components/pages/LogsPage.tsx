/* eslint-disable consistent-return */
/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import EvosStore from 'renderer/lib/EvosStore';
import { useTranslation } from 'react-i18next';
import { withElectron } from 'renderer/utils/electronUtils';

/**
 * Represents a log file with metadata and content
 */
interface LogFile {
  /** Unique identifier for the log file */
  id: string;
  /** Display name of the log file */
  name: string;
  /** Full file system path to the log file */
  fullPath: string;
  /** Last modification date of the log file */
  lastModified: Date;
  /** Content of the log file (loaded on demand) */
  content?: string;
  /** Whether this log file is part of a group */
  group?: boolean;
  /** Last read position in the file */
  lastPosition?: number;
  /** File size in bytes */
  size?: number;
}

/**
 * Represents a folder containing log files
 */
interface LogFolder {
  /** Name of the folder */
  name: string;
  /** Full file system path to the folder */
  fullPath: string;
  /** Array of log files in this folder */
  files: LogFile[];
}

/**
 * Extended LogFile interface for DataGrid rows with additional display properties
 */
interface LogFileRow extends LogFile {
  /** Style object for background color based on file age */
  colorStyle: React.CSSProperties;
  /** File size in kilobytes for display */
  sizeInKB: number;
}

/**
 * Formats log file content with color-coded log levels
 * @param logFile - Raw log file content as string
 * @returns Array of JSX elements with styled log lines
 */
function formatLog(logFile: string): React.JSX.Element[] {
  const logLines = logFile.split('\n');

  let lastColorStyle: React.CSSProperties = {};

  const formattedLog = logLines.map((line, index) => {
    const match = line.match(/(\[\w+\])/);
    if (match) {
      const logLevel = match[1];
      let colorStyle: React.CSSProperties;

      switch (logLevel) {
        case '[NOT]':
          colorStyle = { color: 'green', backgroundColor: 'lightgreen' };
          break;
        case '[WRN]':
          colorStyle = { color: 'darkorange', backgroundColor: 'moccasin' };
          break;
        case '[ERR]':
          colorStyle = { color: 'darkred', backgroundColor: 'mistyrose' };
          break;
        case '[INF]':
          colorStyle = { color: 'navy', backgroundColor: 'lightblue' };
          break;
        default:
          colorStyle = lastColorStyle;
      }

      lastColorStyle = colorStyle;

      return (
        <div
          key={index}
          style={{ paddingLeft: '10px', whiteSpace: 'pre-wrap', ...colorStyle }}
        >
          {line}
        </div>
      );
    }

    return (
      <div
        key={index}
        style={{
          paddingLeft: '10px',
          whiteSpace: 'pre-wrap',
          ...lastColorStyle,
        }}
      >
        {line}
      </div>
    );
  });

  return formattedLog;
}

/**
 * LogsPage component for displaying and managing application log files
 * Provides functionality to view, browse, and open log files in a data grid format
 * @returns JSX.Element representing the logs page
 */
function LogsPage(): React.JSX.Element {
  const { exePath } = EvosStore();
  const [logData, setLogData] = useState<LogFolder[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogFile | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogContentRef, setDialogContentRef] =
    useState<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();

  /**
   * Handles clicking on a log file accordion/row to open its content in a dialog
   * @param log - The log file to open
   */
  const handleAccordionClick = async (log: LogFile): Promise<void> => {
    try {
      setSelectedLog(log);
      setOpenDialog(true);
      setLoading(true);
      const content = await withElectron(
        (electron) => electron.ipcRenderer.getLogContent(log.fullPath),
        null,
      );
      if (content !== null) {
        log.content = content;
        setLogData((prevData) => {
          const updatedData = prevData.map((folder) => {
            return {
              ...folder,
              files: folder.files.map((file) =>
                file.id === log.id ? { ...file, content } : file,
              ),
            };
          });
          return updatedData;
        });
      }
    } catch (error) {
      // Handle error - could add proper error handling here
      // Error loading log content: error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Opens the folder containing the selected log file in the system file explorer
   */
  const handleOpenFolder = (): void => {
    if (selectedLog) {
      const folderPath = selectedLog.fullPath.substring(
        0,
        selectedLog.fullPath.lastIndexOf('\\'),
      );
      withElectron((electron) => electron.ipcRenderer.openFolder(folderPath));
    }
  };

  /**
   * Closes the log content dialog
   */
  const handleCloseDialog = (): void => {
    setOpenDialog(false);
  };

  /**
   * Effect hook to fetch log data on component mount and set up periodic refresh
   * Fetches log files from the Logs folder relative to the executable path
   */
  useEffect(() => {
    const fetchLogData = async (): Promise<void> => {
      try {
        const forwardSlashPath = exePath.replace(/\\/g, '/');
        const pathArray = forwardSlashPath.split('/');
        pathArray.splice(-2);
        pathArray.push('Logs');
        const logFolderPath = pathArray.join('\\');
        const data = await withElectron(
          (electron) => electron.ipcRenderer.getLogData(logFolderPath),
          null,
        );

        // Process the fetched data with proper typing
        if (data && Array.isArray(data)) {
          (data as LogFolder[]).forEach((folder: LogFolder) => {
            folder.files.forEach((file) => {
              file.lastModified = new Date(file.lastModified);
            });

            folder.files.sort(
              (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
            );
          });

          (data as LogFolder[]).sort(
            (a: LogFolder, b: LogFolder) =>
              b.files[0].lastModified.getTime() -
              a.files[0].lastModified.getTime(),
          );

          setLogData(data as LogFolder[]);
        }
      } catch (error) {
        // Handle error silently - could add proper error handling here
      }
    };

    fetchLogData();
    const intervalId = setInterval(fetchLogData, 10000);

    return () => clearInterval(intervalId);
  }, [exePath]);

  /**
   * Effect hook to auto-scroll dialog content to bottom only when a new log is opened
   * Only triggers once when the log content is loaded
   */
  useEffect(() => {
    if (dialogContentRef && selectedLog && selectedLog.content && !loading) {
      // Only auto-scroll when content is first loaded and available
      setTimeout(() => {
        if (dialogContentRef) {
          dialogContentRef.scrollTop = dialogContentRef.scrollHeight;
        }
      }, 200); // Increased delay to ensure content is fully rendered
    }
  }, [dialogContentRef, selectedLog?.content, selectedLog, loading]); // Only depend on content availability

  /**
   * Calculates background color intensity based on file age
   * Newer files appear more green, older files appear more red
   * @param lastModified - Date when the file was last modified
   * @returns RGBA color string for background
   */
  function calculateColorIntensity(lastModified: Date): string {
    const now = new Date();
    const timeDifference = now.getTime() - lastModified.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    // Debug: files from today should have low minutesDifference
    // console.log(`File age in minutes: ${minutesDifference}`);

    // Files newer than 1 minute: bright green
    if (minutesDifference < 1) {
      return 'rgba(0, 255, 0, 0.4)'; // Bright green for very recent files
    }

    // Files 1-240 minutes: transition from green to yellow/red
    const maxAgeMinutes = 240;
    const normalizedAge = Math.min(minutesDifference / maxAgeMinutes, 1);

    // For recent files: more green, less red
    // For old files: more red, less green
    const redValue = Math.floor(255 * normalizedAge);
    const greenValue = Math.floor(255 * (1 - normalizedAge));
    const blueValue = 30;

    const color = `rgba(${redValue}, ${greenValue}, ${blueValue}, 0.4)`;
    // console.log(`Minutes: ${minutesDifference.toFixed(1)}, Color: ${color}`);

    return color;
  }

  // Define columns for the DataGrid
  const columns: GridColDef<LogFileRow>[] = [
    {
      field: 'name',
      headerName: t('logs.logName'),
      flex: 1,
      maxWidth: 400,
      minWidth: 300,
    },
    {
      field: 'lastModified',
      headerName: t('logs.logDate'),
      flex: 1,
      valueGetter: (params) => {
        const { lastModified } = params.row as LogFile;
        return lastModified ? new Date(lastModified).toLocaleString() : '';
      },
      renderCell: (params) => (
        <div
          style={{ ...params.row.colorStyle, padding: '8px', minWidth: 200 }}
        >
          {params.row.lastModified.toLocaleString()}
        </div>
      ),
    },
    {
      field: 'size',
      headerName: t('logs.logSize'),
      flex: 1,
      valueGetter: (params) => {
        let sizeInKB = (params.row.size || 0) / 1024;
        // round up
        sizeInKB = Math.ceil(sizeInKB);
        return `${sizeInKB}KB`;
      },
    },
    {
      field: 'action',
      headerName: t('logs.logAction'),
      flex: 1,
      maxWidth: 170,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => handleAccordionClick(params.row as LogFile)}
        >
          {t('logs.logOpen')}
        </Button>
      ),
    },
  ];

  const filteredRows = logData.reduce((acc, folder) => {
    const folderRows = folder.files.map((file): LogFileRow => {
      const colorStyle: React.CSSProperties = {
        backgroundColor: calculateColorIntensity(file.lastModified),
      };

      return {
        ...file,
        id: file.fullPath,
        colorStyle,
        sizeInKB: (file.size || 0) / 1024,
      };
    });

    return acc.concat(folderRows);
  }, [] as LogFileRow[]);

  // Render the logs page with DataGrid and dialog components
  return (
    <Box
      sx={{
        padding: '2em',
      }}
    >
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          density="compact"
          pageSizeOptions={[5, 10, 25, 50, 100]}
          autoHeight
          slots={{ toolbar: GridToolbar }}
          localeText={{
            noRowsLabel: t('logs.noLogs'),
            MuiTablePagination: {
              labelRowsPerPage: t('logs.rowsPerPage'),
              labelDisplayedRows({ from, to, count }) {
                return `${from}-${to} ${t('logs.of')} ${count}`;
              },
            },
          }}
        />
      </Paper>

      {selectedLog && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          fullWidth
          maxWidth="xl"
        >
          <DialogTitle>{selectedLog.name}</DialogTitle>
          <DialogContent
            className="log-dialog-content"
            sx={{
              overflowX: 'hidden',
              overflowY: 'auto',
              maxHeight: '70vh',
              padding: '16px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#888 #f1f1f1',
            }}
            ref={(ref: HTMLDivElement | null) => setDialogContentRef(ref)}
          >
            {loading ? (
              <Box sx={{ textAlign: 'center', padding: '20px' }}>
                <CircularProgress />
              </Box>
            ) : (
              formatLog(selectedLog.content || '')
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleOpenFolder} color="primary">
              {t('logs.openLogsFolder')}
            </Button>
            <Button onClick={handleCloseDialog}>{t('close')}</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

export default LogsPage;
