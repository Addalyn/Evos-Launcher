/**
 * @fileoverview Entry point for the React renderer process
 * Initializes the React application root and mounts the main App component.
 * Sets up internationalization and renders the application in strict mode.
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

import './i18n';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
