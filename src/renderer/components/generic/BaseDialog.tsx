/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/require-default-props */
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { DialogProps } from '@mui/material/Dialog/Dialog';
import React from 'react';

interface BaseDialogProps {
  props?: DialogProps;
  title?: string | React.ReactNode;
  content?: string | React.ReactNode;
  dismissText?: string;
  onDismiss: () => void;
}

export default function BaseDialog({
  props,
  title,
  content,
  dismissText,
  onDismiss,
}: BaseDialogProps) {
  const dialogProps = props ?? {};
  return (
    <Dialog open={!!title} {...dialogProps}>
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      {content && (
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {content}
          </DialogContentText>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onDismiss} autoFocus>
          {dismissText ?? 'Ok'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
