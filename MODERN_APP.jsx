import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Fingerprint } from 'lucide-react';
import { CustomCursor, AmbientBackground } from './src/components/UI/UIComponents';
import Landing from './src/pages/index';
import TestPage from './src/pages/test';
import { Dashboard, AnalyzingScreen } from './src/components/Dashboard';

export default function App() {
  const [stage, setStage] = useState('landing'); // landing, test, analyzing, results
  const [testResults, setTestResults] = useState({ motor: 650, facial: 800 });

  const handleAllTestsComplete = (results) => {
    setTestResults(results);
    setStage('analyzing');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30 relative flex flex-col overflow-x-hidden">
      <CustomCursor />
      <AmbientBackground isTestActive={stage === 'test'} />

      <header className="relative z-20 w-full px-8 py-6 flex justify-between items-center mix-blend-screen">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStage('landing')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] relative">
            <div className="absolute inset-0.5 bg-[#030712] rounded-[10px]" />
            <Fingerprint className="text-cyan-400 relative z-10 w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-widest text-white uppercase">NeuroDect</h1>
            <p className="text-[9px] font-mono text-cyan-400 tracking-[0.2em] uppercase">By DiNeuro</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {stage === 'landing' && <Landing key="landing" onStart={() => setStage('test')} />}
          {stage === 'test' && <TestPage key="test" onCompleteAll={handleAllTestsComplete} />}
          {stage === 'analyzing' && <AnalyzingScreen key="analyzing" onComplete={() => setStage('results')} />}
          {stage === 'results' && <Dashboard key="results" results={testResults} />}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-6 w-full text-center pointer-events-none z-0 opacity-40">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan-500/50">GDG Open Innovation Domain • AI Healthcare</p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
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
