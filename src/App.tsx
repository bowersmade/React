import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/global/layout';
import Spinner from './components/atoms/spinner/spinner';

/**
 * Every route is code-split. `lazy` turns each import into its own bundle that
 * the browser fetches the first time someone visits that path, so landing on the
 * dashboard does not also download the comparison screen.
 *
 * The dashboard is split too. Its chunk is requested immediately on load, so
 * this costs one extra round trip on first paint — worth it for consistency,
 * and cheap next to the 6.65MB of data arriving alongside it.
 */
const Dashboard = lazy(() => import('./pages/Dashboard'));
const VulnerabilityList = lazy(() => import('./pages/VulnerabilityList'));
const TrendAnalysis = lazy(() => import('./pages/TrendAnalysis'));
const Compare = lazy(() => import('./pages/Compare'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** Shown while a route's chunk is downloading — usually a few hundred ms, once per route. */
function RouteFallback() {
  return (
    <div className="flex justify-center py-24">
      <Spinner size="lg" label="Loading page" />
    </div>
  );
}

function App() {
  return (
    <Layout>
      {/*
        Suspense fills the gap while a lazy chunk downloads. Without it, React
        throws when it hits a component that is not there yet.

        One boundary around all routes is enough here: only one route renders at
        a time, so they can share it.
      */}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vulnerabilities" element={<VulnerabilityList />} />
          <Route path="/trends" element={<TrendAnalysis />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
