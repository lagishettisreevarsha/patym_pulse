import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import PulseDetail from './pages/PulseDetail';
import AskPulse from './pages/AskPulse';
import { Activity, MessageSquare, LayoutDashboard, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// Subcomponent to handle active nav styling
function Navigation() {
  const location = useLocation();
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const isActive = (path: string) => location.pathname === path;

  const triggerReset = async () => {
    if (resetting) return;
    setResetting(true);
    setResetMsg('Resetting...');
    try {
      await axios.post('/api/demo/reset');
      setResetMsg('Reset Success!');
      setTimeout(() => {
        setResetMsg('');
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(error);
      setResetMsg('Reset Failed');
      setTimeout(() => setResetMsg(''), 2000);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-paytm-blue hover:scale-105 duration-200 glow-blue">
            <Activity className="h-6 w-6 text-paytm-cyan" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">Paytm <span className="text-paytm-cyan text-glow-blue">Business Pulse</span></span>
            <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">Decision-Support Layer</span>
          </div>
        </div>

        <nav className="hidden md:flex space-x-1">
          <Link
            to="/"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/')
                ? 'bg-paytm-blue text-white border-b-2 border-paytm-cyan'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/pulse"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/pulse')
                ? 'bg-paytm-blue text-white border-b-2 border-paytm-cyan'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Business Pulse</span>
          </Link>
          <Link
            to="/ask"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/ask')
                ? 'bg-paytm-blue text-white border-b-2 border-paytm-cyan'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Ask Assistant</span>
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          {/* Demo Data Mode indicator */}
          <div className="flex items-center space-x-2 rounded-full bg-amber-500/10 px-3 py-1 border border-amber-500/20 text-xs font-semibold text-amber-400">
            <Database className="h-3 w-3 animate-pulse" />
            <span>Demo Data Mode</span>
          </div>

          <button
            onClick={triggerReset}
            disabled={resetting}
            title="Reset Seed Data"
            className="flex items-center justify-center p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 duration-150 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${resetting ? 'animate-spin text-paytm-cyan' : ''}`} />
            {resetMsg && <span className="ml-2 text-xs font-medium">{resetMsg}</span>}
          </button>
        </div>
      </div>
      
      {/* Mobile nav indicator bar */}
      <div className="flex md:hidden border-t border-slate-800 bg-slate-950 justify-around py-2">
        <Link
          to="/"
          className={`flex flex-col items-center p-2 rounded-lg text-[10px] font-medium transition-all ${
            isActive('/') ? 'text-paytm-cyan' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/pulse"
          className={`flex flex-col items-center p-2 rounded-lg text-[10px] font-medium transition-all ${
            isActive('/pulse') ? 'text-paytm-cyan' : 'text-slate-400'
          }`}
        >
          <Activity className="h-5 w-5 mb-0.5" />
          <span>Pulse</span>
        </Link>
        <Link
          to="/ask"
          className={`flex flex-col items-center p-2 rounded-lg text-[10px] font-medium transition-all ${
            isActive('/ask') ? 'text-paytm-cyan' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="h-5 w-5 mb-0.5" />
          <span>Ask</span>
        </Link>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pulse" element={<PulseDetail />} />
            <Route path="/ask" element={<AskPulse />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Paytm Business Pulse. All rights reserved.</p>
            <div className="flex items-center space-x-1 text-amber-500/80">
              <AlertTriangle className="h-3 w-3" />
              <span>Demo Data Mode Enabled. No real Paytm credentials connected.</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
