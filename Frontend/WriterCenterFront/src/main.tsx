import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';
import { installDebugLogCapture } from './shared/lib/debugLogger';

// Capture all console output for the on-screen debug panel
installDebugLogCapture();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
