import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { store } from './store/store';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { VulnerabilityProvider } from './context/vulnerabilitiesContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <VulnerabilityProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </VulnerabilityProvider>
    </BrowserRouter>
  </React.StrictMode>
);
