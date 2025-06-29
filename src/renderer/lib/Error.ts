/**
 * @fileoverview Error handling utilities for the Evos Launcher
 * Provides standardized error processing and user-friendly error message handling.
 * Manages authentication errors, navigation, and internationalized error messages.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

/**
 * Interface for standardized error objects
 * @interface EvosError
 * @property {string} text - Main error message text
 * @property {string} [description] - Optional detailed error description
 */
export interface EvosError {
  text: string;
  description?: string;
}

/**
 * Processes and handles various types of errors with appropriate user feedback
 * @param error - The error object to process
 * @param setError - Function to set error state in the UI
 * @param navigate - Navigation function for routing
 * @param signOut - Function to sign out the user
 * @param t - Translation function for internationalized messages
 */
export function processError(
  error: any,
  setError: (e: EvosError) => void,
  navigate: (url: string) => void,
  signOut: () => void,
  t: (key: string) => string,
) {
  if (error.response?.status === 401) {
    signOut();
    navigate('/login');
  } else if (error.response?.status === 404) {
    setError({ text: t('errors.notFound') });
  } else if (error.response?.status === 403) {
    setError({ text: t('errors.accessDenied') });
  } else if (error.response?.status === 400) {
    setError({
      text: error.response?.data?.message ?? t('errors.badRequest'),
    });
  } else if (
    !error.response ||
    error.response?.status === 500 ||
    error.response?.status === 502
  ) {
    setError({
      text: t('errors.serverOffline'),
    });
  } else {
    setError({ text: t('errors.unknownError') });
  }
}

export function isValidExePath(path: string) {
  const invalidPathRegex =
    /[A-Za-z]:\\(?:.*\\)*OneDrive(?:.*\\)*Win64\\AtlasReactor.exe/;
  const validPathRegex =
    /^[A-Za-z]:\\[^\\]+\\(?:[^\\]+\\)*Win64\\AtlasReactor.exe$/;

  return validPathRegex.test(path) && !invalidPathRegex.test(path);
}

export function isWarningPath(path: string) {
  const regexProgramFiles = /[A-Za-z]:\\Program Files( \(x86\))?\\.*$/i;
  const regexSteamCommon = /[A-Za-z]:\\.*\\steam\\steamapps\\common\\.*$/i;

  if (regexProgramFiles.test(path)) {
    return !regexSteamCommon.test(path);
  }
  return false;
}
