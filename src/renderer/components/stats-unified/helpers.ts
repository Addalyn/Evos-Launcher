import axios from 'axios';

export interface DataItem {
  total: string;
  user: string;
}

/**
 * Unified fetch function for game info that supports both API versions
 */
export const fetchGameInfoUnified = async (
  action: string,
  apiVersion: 'v1' | 'production',
  signal?: AbortSignal,
) => {
  const baseUrl =
    apiVersion === 'v1'
      ? 'https://stats-v1.evos.live/'
      : 'https://stats-production.evos.live/';
  const url = `${baseUrl}api/stats/${action}`;

  try {
    const response = await axios.get(url, { signal });
    return response.data.data as DataItem[];
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
      return [] as DataItem[];
    }
    return [] as DataItem[];
  }
};

/**
 * Common props interface for unified components
 */
export interface UnifiedProps {
  apiVersion: 'v1' | 'production';
}
