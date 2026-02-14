import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { SessionPage } from './pages/SessionPage';
import { LoginPage } from './pages/LoginPage';
import { Coffee } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('host_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen font-sans text-black pb-20 bg-[#fce7f3]" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        {/* Global Header */}
        <header className="bg-[#fcd34d] border-b-4 border-black sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="bg-white border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Coffee className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic hidden sm:block">BevvyRun</h1>
              <h1 className="text-xl font-black tracking-tighter uppercase italic sm:hidden">Bevvy</h1>
            </Link>
          </div>
        </header>

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/session/:id" element={<SessionPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;