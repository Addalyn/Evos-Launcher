export interface EvosError {
  text: string;
  description?: string;
}

export function processError(
  error: any,
  setError: (e: EvosError) => void,
  navigate: (url: string) => void,
  signOut: () => void
) {
  if (error.response?.status === 401) {
    signOut();
    navigate('/login');
  } else if (error.response?.status === 404) {
    setError({ text: 'Not found.' });
  } else if (error.response?.status === 403) {
    setError({ text: 'Access denied.' });
  } else if (error.response?.status === 400) {
    setError({
      text: error.response?.data?.message ?? 'Bad request.',
    });
  } else if (
    !error.response ||
    error.response?.status === 500 ||
    error.response?.status === 502
  ) {
    setError({
      text: 'Altas Reactor Server is offline. Some Functions may be limited',
    });
  } else {
    setError({ text: 'Unknown error try again.' });
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
