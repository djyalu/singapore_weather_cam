import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppDataProvider from './contexts/AppDataContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);