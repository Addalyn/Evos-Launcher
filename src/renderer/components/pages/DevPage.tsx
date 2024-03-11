/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import {
  Box,
  Button,
  LinearProgress,
  LinearProgressProps,
  Typography,
} from '@mui/material';
import EvosStore from 'renderer/lib/EvosStore';
import { useTranslation } from 'react-i18next';
import { truncateDynamicPath } from './SettingsPage';

interface Files {
  id: number;
  fileName: string;
  percent: number;
  transferredBytes: number;
  totalBytes: number;
}

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
        {props.bytes !== 0 && props.totalbytes !== 0
          ? `${props.t('download.to')} ${truncateDynamicPath(props.text, 45)}`
          : ''}
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

export default function DevPage() {
  const { exePath } = EvosStore();
  const { t } = useTranslation();
  const [files, setFiles] = useState<Files[]>([]);

  const handleDownloadProgress = (event: any) => {
    const { id, fileName, status } = event;
    const { percent, transferredBytes, totalBytes } = status;

    setFiles((prevFiles) => {
      if (!prevFiles.find((file) => file.id === id)) {
        return [
          ...prevFiles,
          {
            id,
            fileName,
            percent,
            transferredBytes,
            totalBytes,
          },
        ];
      }
      const updatedFiles = prevFiles.map((file) => {
        if (file.id === id) {
          return {
            ...file,
            percent,
            transferredBytes,
            totalBytes,
          };
        }
        return file;
      });
      return updatedFiles;
    });
  };
  window.electron.ipcRenderer.on('download progress', handleDownloadProgress);

  const handleDownloadComplete = (event: any) => {
    const { id } = event;
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  window.electron.ipcRenderer.on('download complete', handleDownloadComplete);

  const testDownload = () => {
    const forwardSlashPath = exePath.replace(/\\/g, '/');
    const pathArray = forwardSlashPath.split('/');
    pathArray.splice(-2);
    const downloadPath = pathArray.join('\\');
    window.electron.ipcRenderer.sendMessage('downloadGame', downloadPath);
  };

  return (
    <div>
      <Typography variant="h4">
        Dev Stuff not ready for release and may crash launcher
      </Typography>
      <Button onClick={testDownload}>Test Download</Button>
      {files.length}
      {files.map((file) => (
        <LinearProgressWithLabel
          key={file.fileName}
          value={file.percent}
          text={file.fileName}
          bytes={file.transferredBytes}
          totalbytes={file.totalBytes}
          t={t}
        />
      ))}
    </div>
  );
}
