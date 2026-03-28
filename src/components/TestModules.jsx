import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ScanFace, Mic, Target } from 'lucide-react';

export const FaceMesh = ({ onComplete }) => {
  const [scanLine, setScanLine] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine(prev => (prev >= 100 ? 0 : prev + 2));
      setScore(prev => (prev < 98 ? prev + 1.5 : 98));
    }, 50);
    const timeout = setTimeout(() => onComplete({ faceScore: 98 }), 3500);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center p-8 h-[600px] justify-center relative">
      <div className="relative w-64 h-64 rounded-full border border-cyan-500/30 bg-slate-900/50 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        <ScanFace className="w-24 h-24 text-cyan-500/20 absolute" />
        <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 100 100">
          <motion.path 
            d="M30,40 Q50,20 70,40 Q80,60 70,80 Q50,95 30,80 Q20,60 30,40 Z" 
            fill="none" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="2 2"
            animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          />
        </svg>
        <div className="absolute left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee]" style={{ top: `${scanLine}%` }} />
      </div>
      <div className="mt-8 text-center w-full max-w-xs">
        <div className="flex justify-between text-xs font-mono text-cyan-400 mb-2 uppercase tracking-widest">
          <span>Mapping CN-VII</span>
          <span>{Math.floor(score)}% Symmetry</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-cyan-400" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3.5 }} />
        </div>
      </div>
    </div>
  );
};

export const HandTracker = ({ onComplete }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const tremorX = (Math.random() - 0.5) * 15;
      const tremorY = (Math.random() - 0.5) * 15;
      setMousePos({ x: e.clientX - rect.left + tremorX, y: e.clientY - rect.top + tremorY });
    };
    window.addEventListener('mousemove', handleMove);
    const timeout = setTimeout(() => onComplete({ tremorFreq: '4.8Hz' }), 4500);
    return () => { window.removeEventListener('mousemove', handleMove); clearTimeout(timeout); };
  }, [onComplete]);

  return (
    <div ref={containerRef} className="flex flex-col items-center p-8 h-[600px] justify-center relative overflow-hidden">
      <div className="absolute top-8 text-center w-full">
         <p className="text-sm font-mono text-emerald-400 uppercase tracking-widest animate-pulse">Hold cursor inside the target</p>
      </div>
      <div className="relative w-64 h-64 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
        <Target className="w-8 h-8 text-emerald-500/40 absolute" />
        <motion.div 
          className="absolute w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_15px_#34d399]"
          animate={{ x: mousePos.x - 128, y: mousePos.y - 128 }}
          transition={{ type: "tween", duration: 0.05 }}
        />
      </div>
      <div className="absolute bottom-8 left-8 text-xs font-mono text-emerald-400/50">
        <div>X_DEV: {(mousePos.x - 128).toFixed(2)}</div>
        <div>Y_DEV: {(mousePos.y - 128).toFixed(2)}</div>
      </div>
    </div>
  );
};
