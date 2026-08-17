import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Layout from './components/global/layout';
import NotFound from './pages/NotFound';

// Swap to the sandbox when you want to review components in isolation.
// import Sandbox from './pages/sandbox/sandbox';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
