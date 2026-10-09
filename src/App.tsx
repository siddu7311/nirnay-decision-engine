import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NewDecision } from './pages/NewDecision';
import { EditDecision } from './pages/EditDecision';
import { Results } from './pages/Results';
import { WhatIf } from './pages/WhatIf';
import { Sensitivity } from './pages/Sensitivity';
import { History } from './pages/History';
import { HowItWorks } from './pages/HowItWorks';
import { About } from './pages/About';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewDecision />} />
        <Route path="/decision/:id/results" element={<Results />} />
        <Route path="/decision/:id/edit" element={<EditDecision />} />
        <Route path="/decision/:id/whatif" element={<WhatIf />} />
        <Route path="/decision/:id/sensitivity" element={<Sensitivity />} />
        <Route path="/history" element={<History />} />
        <Route path="/how" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
