import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Fingerprint, LogOut, User as UserIcon, Activity as ActivitySquare } from 'lucide-react';
import { AmbientBackground } from './components/UI/UIComponents';
import Landing from './pages/index';
import TestPage from './pages/test';
import DashboardHub from './pages/DashboardHub';
import Intro from './pages/Intro';
import LoginPage from './pages/LoginPage';
import { Dashboard, AnalyzingScreen } from './components/Dashboard';
import { analyzeResults, getMe, removeToken, aggregateResults } from './lib/api';

export default function App() {
  const [stage, setStage] = useState('intro'); // intro, login, hub, test, analyzing, results
  const [user, setUser] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Persistence: Check for existing session
  useEffect(() => {
    const initSession = async () => {
      try {
        const userData = await getMe();
        if (userData) {
          setUser(userData);
          setStage('hub');
        }
      } catch (err) {
        console.error("Session initialization failed", err);
      } finally {
        setIsInitializing(false);
      }
    };
    initSession();
  }, []);

  const handleAllTestsComplete = async (results) => {
    console.log("CRITICAL: All tests complete. Data package received:", results);
    setStage('analyzing');
    setIsDataReady(false);

    try {
      console.log("API CALL: Fetching aggregated clinical consensus...");
      const aggregatedData = await aggregateResults();

      console.log("API SUCCESS: Backend returned consensus:", aggregatedData);
      setTestResults(aggregatedData);
    } catch (err) {
      console.error("API FAILURE: Aggregation failed", err);
      // Fallback: Use raw results if aggregation fails
      setTestResults({ test_results: results, consensus: null });
    } finally {
      console.log("FLOW: Transitioning to results stage.");
      setIsDataReady(true);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setStage('hub');
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setStage('intro');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-700 rounded-full animate-spin" />
      </div>
    );
  }

  const showHeader = ['hub', 'test', 'analyzing', 'results'].includes(stage);

  return (
    <div className="min-h-screen bg-[#E3DFD6] text-slate-800 font-sans selection:bg-teal-500/30 relative flex flex-col overflow-x-hidden">
      {stage === 'intro' ? (
        <div className="fixed inset-0 bg-[#f0fdf4] -z-10" />
      ) : (
        <AmbientBackground isTestActive={stage === 'test'} />
      )}

      {showHeader && (
        <header className="relative z-20 w-full px-8 py-6 flex justify-between items-center bg-white/40 backdrop-blur-md header-container">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStage('hub')}>
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-medical border border-[#F1E9DB] relative group transition-all hover:shadow-medical-lg">
              <Fingerprint className="text-teal-700 w-7 h-7 transition-transform group-hover:scale-110" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight text-slate-900">NeuroDect</h1>
              <p className="text-[10px] font-bold text-teal-700 tracking-widest uppercase">Clinical AI Protocol</p>
            </div>
          </div>

          <nav className="hidden md:flex flex-col items-end gap-2">
            <div className="flex items-center gap-8">
              {user && user.name && (
                <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-xl border border-teal-100">
                  <UserIcon size={14} className="text-teal-600" />
                  <span className="text-xs font-bold text-teal-800">Client: {user.name.split(' ')[0]}</span>
                </div>
              )}
              <button className={`text-sm font-bold transition-colors ${stage === 'hub' ? 'text-teal-700' : 'text-slate-500 hover:text-teal-700'}`} onClick={() => setStage('hub')}>Hub</button>
              <div className="h-4 w-[1px] bg-[#F1E9DB]" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
              >
                <LogOut size={16} />
                Exit Portal
              </button>
            </div>
            <div className="flex gap-1 pr-1">
              <div className="h-1 w-10 bg-teal-600/30 rounded-full" />
              <div className="h-1 w-5 bg-rose-400/30 rounded-full" />
            </div>
          </nav>
        </header>
      )}

      <main className={`relative z-10 flex-grow flex items-center justify-center ${stage === 'intro' ? '' : 'p-6'}`}>
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <Intro key="intro" onEnter={() => setStage('login')} onViewDashboard={() => setStage('login')} />
          )}

          {stage === 'login' && (
            <LoginPage key="login" onLoginSuccess={handleLoginSuccess} />
          )}

          {stage === 'hub' && (
            <DashboardHub
              key="hub"
              onStartTest={() => setStage('test')}
              onViewResult={(results) => {
                setTestResults(results);
                setStage('results');
              }}
              user={user}
            />
          )}

          {stage === 'test' && (
            <TestPage key="test" onCompleteAll={handleAllTestsComplete} user={user} />
          )}

          {stage === 'analyzing' && (
            <AnalyzingScreen
              key="analyzing"
              isDataReady={isDataReady}
              onComplete={() => setStage('results')}
            />
          )}

          {stage === 'results' && (
            <div className="flex flex-col items-center gap-10 w-full max-w-6xl">
              <Dashboard results={testResults} />
              <div className="flex flex-wrap justify-center gap-6">
                <button
                  onClick={() => setStage('test')}
                  className="px-10 py-5 bg-white text-teal-700 border-2 border-teal-100 rounded-2xl font-bold shadow-medical hover:bg-teal-50 transition-all active:scale-95 text-lg flex items-center gap-3"
                >
                  <ActivitySquare size={24} />
                  Re-run Screening
                </button>
                <button
                  onClick={() => setStage('hub')}
                  className="px-10 py-5 bg-teal-700 text-white rounded-2xl font-bold shadow-medical-xl hover:bg-teal-800 transition-all active:scale-95 text-lg"
                >
                  Return to Protocol Hub
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-20 w-full px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-[#F1E9DB] bg-white/20">
        <p className="font-bold text-[10px] tracking-wider uppercase text-slate-400">GDG Open Innovation • AI Healthcare Division</p>
      </footer>

      {/* Global Clinical Disclaimer */}
      <div className="fixed bottom-4 right-6 z-50 pointer-events-none">
        <p className="text-[10px] font-medium text-slate-400 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm transition-opacity hover:opacity-100 opacity-60 max-w-sm text-right">
          ⚠️ DISCLAIMER: This experimental tool is not a substitute for professional clinical diagnosis.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-reverse-spin {
          animation: reverse-spin 2s linear infinite;
        }
      `}} />
    </div>
  );
}
