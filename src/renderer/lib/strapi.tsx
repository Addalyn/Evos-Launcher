/* eslint-disable import/prefer-default-export */
import {
  createClient,
  createClient as createClientv1,
} from '@kmariappan/strapi-client-js';

/**
 * Configuration options for the main Strapi client connection
 * @type {Object}
 * @property {string} url - The base URL for the Strapi API endpoint
 * @property {string} apiToken - Built-in API token for authentication (empty by default)
 * @property {boolean} normalizeData - Whether to normalize the unified response format
 * @property {Object} headers - Custom HTTP headers for cache control
 * @property {boolean} persistSession - Whether to persist authenticated token in browser local storage
 * @property {boolean} debug - Whether to enable debug logging
 */
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

/**
 * Main Strapi client instance for the production stats API
 * @type {import('@kmariappan/strapi-client-js').StrapiClient}
 */
export const strapiClient = createClient(options);

/**
 * Configuration options for the v1 Strapi client connection
 * @type {Object}
 * @property {string} url - The base URL for the v1 Strapi API endpoint
 * @property {string} apiToken - Built-in API token for authentication (empty by default)
 * @property {boolean} normalizeData - Whether to normalize the unified response format
 * @property {Object} headers - Custom HTTP headers for cache control
 * @property {boolean} persistSession - Whether to persist authenticated token in browser local storage
 * @property {boolean} debug - Whether to enable debug logging
 */
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

/**
 * Strapi client instance for the v1 stats API
 * @type {import('@kmariappan/strapi-client-js').StrapiClient}
 */
export const strapiClientv1 = createClientv1(optionsv1);
