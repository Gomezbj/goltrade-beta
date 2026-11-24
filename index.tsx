
import React from 'react';
import ReactDOM from 'react-dom/client';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import AppWrapper from './AppWrapper';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
