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
      valueGetter: (value, row) => {
        const { lastModified } = row as LogFile;
        return lastModified ? new Date(lastModified).toLocaleString() : '';
      },
      renderCell: (params) => (
        <div style={{ padding: '8px', minWidth: 200 }}>
          {params.row.lastModified.toLocaleString()}
        </div>
      ),
    },
    {
      field: 'size',
      headerName: t('logs.logSize'),
      flex: 1,
      valueGetter: (value, row) => {
        let sizeInKB = (row.size || 0) / 1024;
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
          variant="contained"
          size="small"
          onClick={() => handleAccordionClick(params.row as LogFile)}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '8px',
            padding: '6px 16px',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            },
          }}
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

  // Render the logs page with modern glassmorphism design and gradient header
  return (
    <Box
      sx={{
        padding: '2em',
        minHeight: '100vh',
      }}
    >
      {/* Gradient Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px 16px 0 0',
          padding: '2rem',
          marginBottom: '-1px',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Box
          sx={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '0.5rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          {t('logs.title')}
        </Box>
        <Box
          sx={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 400,
          }}
        >
          {t('logs.subtitle')}
        </Box>
      </Box>

      {/* Glassmorphism Container */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: '0 0 16px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
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
            paginationRowsPerPage: t('logs.rowsPerPage'),
            paginationDisplayedRows: ({ from, to, count }) => {
              return `${from}-${to} ${t('logs.of')} ${count}`;
            },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '& .MuiDataGrid-columnHeaders': {
              background:
                'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              fontSize: '0.95rem',
              fontWeight: 600,
            },
            '& .MuiDataGrid-row': {
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.08)',
                transform: 'translateX(4px)',
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.02)',
            },
          }}
        />
      </Paper>

      {/* Modern Dialog with Glassmorphism */}
      {selectedLog && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          fullWidth
          maxWidth="xl"
          PaperProps={{
            sx: {
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1.25rem',
              padding: '1.5rem',
            }}
          >
            {selectedLog.name}
          </DialogTitle>
          <DialogContent
            className="log-dialog-content"
            sx={{
              overflowX: 'hidden',
              overflowY: 'auto',
              maxHeight: '70vh',
              padding: '16px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#667eea rgba(0, 0, 0, 0.1)',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '4px',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              },
            }}
            ref={(ref: HTMLDivElement | null) => setDialogContentRef(ref)}
          >
            {loading ? (
              <Box sx={{ textAlign: 'center', padding: '20px' }}>
                <CircularProgress sx={{ color: '#667eea' }} />
              </Box>
            ) : (
              formatLog(selectedLog.content || '')
            )}
          </DialogContent>
          <DialogActions
            sx={{
              padding: '1rem 1.5rem',
              background: 'rgba(0, 0, 0, 0.02)',
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Button
              onClick={handleOpenFolder}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                fontWeight: 600,
                padding: '8px 24px',
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                },
              }}
            >
              {t('logs.openLogsFolder')}
            </Button>
            <Button
              onClick={handleCloseDialog}
              sx={{
                color: '#667eea',
                fontWeight: 600,
                padding: '8px 24px',
                borderRadius: '8px',
                textTransform: 'none',
                border: '2px solid #667eea',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.1)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {t('replay.close')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

export default LogsPage;
