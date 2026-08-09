import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SafetyProvider } from './context/SafetyContext';
import { TripProvider } from './context/TripContext';
import './styles/index.css';
import './styles/tactical.css';
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SafetyProvider>
      <TripProvider>
        <App />
      </TripProvider>
    </SafetyProvider>
  </React.StrictMode>
);
