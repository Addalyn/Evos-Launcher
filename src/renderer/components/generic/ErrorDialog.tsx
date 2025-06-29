/**
 * @fileoverview ErrorDialog component for displaying error messages in a modal dialog.
 * This component provides a specialized dialog interface for showing EvosError objects
 * with consistent error messaging and user-friendly error presentation. It extends
 * the BaseDialog component with error-specific styling and behavior.
 */

/* eslint-disable react/require-default-props */
import React from 'react';
import type { DialogProps } from '@mui/material/Dialog/Dialog';
import type { EvosError } from '../../lib/Error';
import BaseDialog from './BaseDialog';

/**
 * Props interface for the ErrorDialog component
 * @interface ErrorDialogProps
 */
interface ErrorDialogProps {
  /** Additional props to pass to the underlying BaseDialog component (excluding 'open') */
  props?: Omit<DialogProps, 'open'>;
  /** The EvosError object containing error details to display */
  error: EvosError;
  /** Callback function called when the error dialog is dismissed */
  onDismiss: () => void;
}

/**
 * ErrorDialog component for displaying error messages in a modal dialog.
 *
 * This component provides a specialized interface for showing EvosError objects
 * in a user-friendly dialog format. It leverages the BaseDialog component and
 * automatically maps error properties to appropriate dialog sections.
 *
 * Features:
 * - Displays error text as the dialog title
 * - Shows error description as the dialog content
 * - Provides a "Close" button for dismissing the error
 * - Inherits all BaseDialog functionality and styling
 * - Type-safe integration with EvosError objects
 *
 * @component
 * @param {ErrorDialogProps} props - The component props
 * @param {Omit<DialogProps, 'open'>} [props.props] - Additional props for the BaseDialog component
 * @param {EvosError} props.error - The error object containing text and description
 * @param {() => void} props.onDismiss - Function called when the dialog is dismissed
 * @returns {React.ReactElement} The rendered error dialog component
 *
 * @example
 * ```tsx
 * const handleError = (error: EvosError) => {
 *   setCurrentError(error);
 * };
 *
 * const handleDismiss = () => {
 *   setCurrentError(null);
 * };
 *
 * return (
 *   <>
 *     {currentError && (
 *       <ErrorDialog
 *         error={currentError}
 *         onDismiss={handleDismiss}
 *       />
 *     )}
 *   </>
 * );
 * ```
 */
export default function ErrorDialog({
  props,
  error,
  onDismiss,
}: ErrorDialogProps): React.ReactElement {
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
