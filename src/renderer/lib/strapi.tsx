/* eslint-disable import/prefer-default-export */
import { createClient } from '@kmariappan/strapi-client-js';

const options = {
  url: `https://stats.evos.live/api`,
  apiToken: '', // Built in API token,
  normalizeData: true, // Normalize Unified response Format. default - true
  headers: {}, // Custom Headers
  persistSession: false, // Persist authenticated token in browser local storage. default -false
  debug: false, // Enable debug logs. default - false
};

export const strapiClient = createClient(options);
