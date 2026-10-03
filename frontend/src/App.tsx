import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { AssessmentsList } from './pages/AssessmentsList';
import { NewAssessment } from './pages/NewAssessment';
import { AssessmentDetail } from './pages/AssessmentDetail';

export const App: React.FC = () => {
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col text-slate-100 antialiased">
        <Navbar onRefresh={() => setRefreshSignal((value) => value + 1)} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/assessments" replace />} />
            <Route path="/assessments" element={<AssessmentsList refreshSignal={refreshSignal} />} />
            <Route path="/assessments/new" element={<NewAssessment />} />
            <Route path="/assessments/:id" element={<AssessmentDetail />} />
            <Route path="*" element={<Navigate to="/assessments" replace />} />
          </Routes>
        </main>
        <footer className="mt-10 border-t border-white/[0.07] bg-slate-950/40 py-6 text-center text-xs text-slate-400">
          <p>LOCO Location Assessment Tool &copy; {new Date().getFullYear()} — Operations Dashboard</p>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
