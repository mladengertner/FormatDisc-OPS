
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './components/App';
import './styles/globals.css';
import { initializeWarStack } from './kernel/warstack/initialize';

// Initialize WarStack (legacy bridge for some internal logic if needed)
export const warStackInstance = initializeWarStack({
  seed: 42,
  mode: 'INDIFFERENT' as const,
});

const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
