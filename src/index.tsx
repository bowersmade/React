import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { store } from './store/store';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { VulnerabilityProvider } from './context/vulnerabilitiesContext';
import MobileNotSupported from './pages/MobileNotSupported';
import { useIsSupportedViewport } from './utils/hooks/useIsSupportedViewport';

/**
 * Gates the whole app — including `VulnerabilityProvider`'s dataset fetch —
 * behind a minimum viewport width. See `useIsSupportedViewport` for why
 * that check has to happen up here rather than inside `App`.
 */
function Root() {
  const isSupported = useIsSupportedViewport();

  if (!isSupported) return <MobileNotSupported />;

  return (
    <BrowserRouter>
      <VulnerabilityProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </VulnerabilityProvider>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
