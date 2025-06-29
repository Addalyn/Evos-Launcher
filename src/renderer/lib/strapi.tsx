/* eslint-disable import/prefer-default-export */
import {
  createClient,
  createClient as createClientv1,
} from '@kmariappan/strapi-client-js';

export const options = {
  url: `https://stats-production.evos.live/api`,
  apiToken: '', // Built in API token,
  normalizeData: true, // Normalize Unified response Format. default - true
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  }, // Custom Headers
  persistSession: false, // Persist authenticated token in browser local storage. default -false
  debug: false, // Enable debug logs. default - false
};

export const strapiClient = createClient(options);

export const optionsv1 = {
  url: `https://stats-v1.evos.live/api`,
  apiToken: '',
  normalizeData: true,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },
  persistSession: true,
  debug: true,
};

export const strapiClientv1 = createClientv1(optionsv1);
