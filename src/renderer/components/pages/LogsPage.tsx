/* eslint-disable consistent-return */
/* eslint-disable react/no-array-index-key */
import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Paper } from '@mui/material';
import EvosStore from 'renderer/lib/EvosStore';

interface LogFile {
  id: string;
  name: string;
  fullPath: string;
  lastModified: Date;
  content?: string;
  group?: boolean;
  lastPosition?: number;
}

interface LogFolder {
  name: string;
  fullPath: string;
  files: LogFile[];
}

function formatLog(logFile: string) {
  const logLines = logFile.split('\n');

  let lastColorStyle = {};

  const formattedLog = logLines.map((line, index) => {
    const match = line.match(/(\[\w+\])/);
    if (match) {
      const logLevel = match[1];
      let colorStyle;

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

function LogsPage() {
  const { exePath } = EvosStore();
  const [logData, setLogData] = useState<LogFolder[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogFile | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContentRef, setDialogContentRef] =
    useState<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAccordionClick = async (log: LogFile) => {
    try {
      setSelectedLog(log);
      setOpenDialog(true);
      setLoading(true);
      const content = await window.electron.ipcRenderer.getLogContent(
        log.fullPath
      );
      log.content = content;
      setLogData((prevData) => {
        const updatedData = prevData.map((folder) => {
          return {
            ...folder,
            files: folder.files.map((file) =>
              file.id === log.id ? { ...file, content } : file
            ),
          };
        });
        return updatedData;
      });
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false); // Reset loading state after content is fetched or on error
    }
  };

  const handleOpenFolder = () => {
    if (selectedLog) {
      const folderPath = selectedLog.fullPath.substring(
        0,
        selectedLog.fullPath.lastIndexOf('\\')
      );
      window.electron.ipcRenderer.openFolder(folderPath);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  useEffect(() => {
    const fetchLogData = async () => {
      try {
        const forwardSlashPath = exePath.replace(/\\/g, '/');
        const pathArray = forwardSlashPath.split('/');
        pathArray.splice(-2);
        pathArray.push('Logs');
        const logFolderPath = pathArray.join('\\');
        const data = await window.electron.ipcRenderer.getLogData(
          logFolderPath
        );
        data.forEach((folder: { files: LogFile[] }) => {
          folder.files.forEach((file) => {
            file.lastModified = new Date(file.lastModified);
          });

          folder.files.sort(
            (a, b) => b.lastModified.getTime() - a.lastModified.getTime()
          );
        });

        data.sort(
          (
            a: { files: { lastModified: { getTime: () => number } }[] },
            b: { files: { lastModified: { getTime: () => number } }[] }
          ) =>
            b.files[0].lastModified.getTime() -
            a.files[0].lastModified.getTime()
        );

        setLogData(data);
      } catch (error) {
        // console.error(error);
      }
    };
    fetchLogData();
    const intervalId = setInterval(fetchLogData, 10000);

    return () => clearInterval(intervalId);
  }, [exePath]);

  useEffect(() => {
    if (dialogContentRef) {
      dialogContentRef.scrollTop = dialogContentRef.scrollHeight;
    }
  }, [dialogContentRef, selectedLog, logData]);

  function calculateColorIntensity(lastModified: Date) {
    const now = new Date();
    const timeDifference = now.getTime() - lastModified.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    const maxIntensity = 60;
    const intensity = Math.min(
      (minutesDifference / 20) * maxIntensity,
      maxIntensity
    );

    const redValue = Math.floor(255 * (1 - intensity / 100));
    const greenValue = Math.floor(255 * (intensity / 100));
    const color = `rgba(${redValue}, ${greenValue}, 0, 1)`;

    return color;
  }

  const coloredRows: LogFile[] = logData.reduce((acc, folder) => {
    const folderRows = folder.files.map((file) => {
      const colorStyle = {
        backgroundColor: calculateColorIntensity(file.lastModified),
      };

      return {
        ...file,
        id: file.fullPath,
        colorStyle,
        sizeInKB: (file.content?.length || 0) / 1024,
      };
    });

    return acc.concat(folderRows);
  }, [] as LogFile[]);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Log Name',
      flex: 1,
    },
    {
      field: 'lastModified',
      headerName: 'Date',
      flex: 1,
      valueGetter: (params) => {
        const { lastModified } = params.row as LogFile;
        return lastModified ? new Date(lastModified).toLocaleString() : '';
      },
      renderCell: (params) => (
        <div style={{ ...params.row.colorStyle, padding: '8px' }}>
          {params.row.lastModified.toLocaleString()}
        </div>
      ),
    },
    {
      field: 'size',
      headerName: 'Size (KB)',
      flex: 1,
      valueGetter: (params) => {
        let sizeInKB = params.row.size / 1024 || 0;
        // round up
        sizeInKB = Math.ceil(sizeInKB);
        return `${sizeInKB}KB`;
      },
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 1,
      maxWidth: 100,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => handleAccordionClick(params.row as LogFile)}
        >
          Open Log
        </Button>
      ),
    },
  ];
  return (
    <Paper elevation={3} style={{ margin: '1em', width: '95%' }}>
      <DataGrid
        rows={coloredRows}
        columns={columns}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        autoHeight
      />
      {selectedLog && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          fullWidth
          maxWidth="xl"
        >
          <DialogTitle>{selectedLog.name}</DialogTitle>
          <DialogContent
            style={{ overflowX: 'hidden' }}
            ref={(ref: HTMLDivElement | null) => setDialogContentRef(ref)}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Loading...{' '}
                {/* You can also use a circular loading indicator here */}
              </div>
            ) : (
              formatLog(selectedLog.content || '')
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleOpenFolder} color="primary">
              Open Folder
            </Button>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
}

export default LogsPage;
