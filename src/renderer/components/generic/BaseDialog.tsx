/**
 * @fileoverview BaseDialog component for displaying modal dialogs.
 * This component provides a reusable dialog interface with customizable title, content,
 * and dismiss button. It serves as a foundation for other dialog components in the application.
 */

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
import type { DialogProps } from '@mui/material/Dialog/Dialog';
import React from 'react';

/**
 * Props interface for the BaseDialog component
 * @interface BaseDialogProps
 */
interface BaseDialogProps {
  /** Additional props to pass to the underlying Material-UI Dialog component (excluding 'open') */
  props?: Omit<DialogProps, 'open'>;
  /** The title of the dialog - can be a string or React node */
  title?: string | React.ReactNode;
  /** The content/body of the dialog - can be a string or React node */
  content?: string | React.ReactNode;
  /** Custom text for the dismiss button (defaults to 'Ok') */
  dismissText?: string;
  /** Callback function called when the dialog is dismissed */
  onDismiss: () => void;
}

/**
 * BaseDialog component for displaying modal dialogs.
 *
 * This is a reusable dialog component that wraps Material-UI's Dialog component
 * with sensible defaults and a simplified API. The dialog is automatically opened
 * when a title is provided and can be dismissed via the dismiss button.
 *
 * @component
 * @param {BaseDialogProps} props - The component props
 * @param {Omit<DialogProps, 'open'>} [props.props] - Additional props for the Dialog component (excludes 'open')
 * @param {string | React.ReactNode} [props.title] - Dialog title (dialog shows when this is truthy)
 * @param {string | React.ReactNode} [props.content] - Dialog content/body
 * @param {string} [props.dismissText] - Text for the dismiss button (defaults to 'Ok')
 * @param {() => void} props.onDismiss - Function called when dialog is dismissed
 * @returns {React.ReactElement} The rendered dialog component
 *
 * @example
 * ```tsx
 * <BaseDialog
 *   title="Confirmation"
 *   content="Are you sure you want to proceed?"
 *   dismissText="Close"
 *   onDismiss={() => setShowDialog(false)}
 * />
 * ```
 */
export default function BaseDialog({
  props,
  title,
  content,
  dismissText,
  onDismiss,
}: BaseDialogProps): React.ReactElement {
  /** Determine if dialog should be open based on title presence */
  const isOpen = Boolean(title);

  /** Additional dialog props, excluding the controlled 'open' prop */
  const additionalProps: Omit<DialogProps, 'open'> = props ?? {};

  return (
    <Dialog open={isOpen} {...additionalProps}>
      {/* Dialog Title Section */}
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>

      {/* Dialog Content Section - Only render if content is provided */}
      {content && (
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {content}
          </DialogContentText>
        </DialogContent>
      )}

      {/* Dialog Actions Section */}
      <DialogActions>
        <Button onClick={onDismiss} autoFocus>
          {dismissText ?? 'Ok'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
