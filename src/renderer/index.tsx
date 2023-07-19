import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-auth-kit';

import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AuthProvider
      authType="localstorage"
      authName="_auth"
      cookieDomain="EvosLauncher"
      cookieSecure={false}
    >
      <App />
    </AuthProvider>
  </React.StrictMode>
);
