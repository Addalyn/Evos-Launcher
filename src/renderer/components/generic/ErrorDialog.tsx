import { DialogProps } from '@mui/material/Dialog/Dialog';
import { EvosError } from '../../lib/Error';
import BaseDialog from './BaseDialog';

interface ErrorDialogProps {
  props?: DialogProps;
  error: EvosError;
  onDismiss: () => void;
}

export default function ErrorDialog({
  props,
  error,
  onDismiss,
}: ErrorDialogProps) {
  return (
    <BaseDialog
      props={props}
      title={error.text}
      content={error.description}
      dismissText="Close"
      onDismiss={onDismiss}
    />
  );
}
