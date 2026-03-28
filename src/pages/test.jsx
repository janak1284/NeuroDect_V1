import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScanFace, Ear, Hand, Brain, CheckCircle2, ChevronRight, ActivitySquare } from 'lucide-react';
import { GlassContainer } from '../components/UI/UIComponents';
import { FaceMesh, HandTracker } from '../components/TestModules';
import NeuralReflexTest from '../components/NeuralReflexTest';

const AudioTest = ({ onComplete }) => (
  <div className="flex flex-col items-center justify-center h-[600px]">
    <p className="text-violet-400 font-mono animate-pulse">Speech/Audio Test Placeholder</p>
    <button onClick={() => onComplete({ speech: "Nominal" })} className="mt-4 px-6 py-2 bg-violet-500/20 border border-violet-400/50 rounded-full text-violet-400">Skip to Result</button>
  </div>
);

const TestPage = ({ onCompleteAll }) => {
  const [currentTest, setCurrentTest] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [results, setResults] = useState({ motor: 650, facial: 800 });

  const tests = [
    { title: "Facial Asymmetry", icon: <ScanFace />, component: FaceMesh, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
    { title: "Acoustic Cadence", icon: <Ear />, component: AudioTest, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30" },
    { title: "Motor Stability", icon: <Hand />, component: HandTracker, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    { title: "Neural Reflex", icon: <Brain />, component: NeuralReflexTest, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" }
  ];

  const handleTestComplete = (data) => {
    if (data && data.motor) {
      setResults(prev => ({ ...prev, motor: data.motor, facial: data.facial }));
    }
    setIsTransitioning(true);
  };

  const proceedToNext = () => {
    if (currentTest < tests.length - 1) {
      setCurrentTest(prev => prev + 1);
      setIsTransitioning(false);
    } else {
      onCompleteAll(results);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isTransitioning ? (
        <GlassContainer key="test" className="w-full max-w-5xl overflow-hidden flex flex-col min-h-[700px]">
          <div className="p-6 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${tests[currentTest].bg} ${tests[currentTest].border} ${tests[currentTest].color} shadow-lg`}>
                {tests[currentTest].icon}
              </div>
              <div>
                <h2 className={`font-mono text-sm tracking-widest uppercase ${tests[currentTest].color}`}>
                  Test {currentTest + 1} of 4
                </h2>
                <h3 className="text-2xl font-bold text-white tracking-tight">{tests[currentTest].title}</h3>
              </div>
            </div>
          </div>
          <div className="flex-grow bg-[#050b14]/50 relative">
            <motion.div key={currentTest} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="absolute inset-0">
              {React.createElement(tests[currentTest].component, { onComplete: handleTestComplete })}
            </motion.div>
          </div>
        </GlassContainer>
      ) : (
        <GlassContainer key="transition" className="max-w-xl w-full p-12 text-center border-emerald-500/30">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Test Complete</h2>
          <p className="text-slate-400 mb-10 font-light">Data captured successfully.</p>
          <motion.button onClick={proceedToNext} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative group inline-flex">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500" />
            <div className="relative px-12 py-4 bg-[#030712] rounded-full flex items-center gap-4 border border-white/10">
              <span className="font-mono text-lg font-bold text-white tracking-widest uppercase">
                {currentTest < tests.length - 1 ? "Start Next Test" : "Generate Report"}
              </span>
              {currentTest < tests.length - 1 ? <ChevronRight size={20} className="text-emerald-400" /> : <ActivitySquare size={20} className="text-emerald-400" />}
            </div>
          </motion.button>
        </GlassContainer>
      )}
    </AnimatePresence>
  );
};

export default TestPage;
