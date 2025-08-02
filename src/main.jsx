import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppDataProvider from './contexts/AppDataContextSimple';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AppDataProvider>
      <App />
    </AppDataProvider>
  </ErrorBoundary>
);