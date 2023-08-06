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
    setError({ text: 'Altas Reactor Server is offline.' });
  } else {
    setError({ text: 'Unknown error try again.' });
  }
}
