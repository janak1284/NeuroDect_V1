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
    const timeout = setTimeout(() => onComplete({ 
      faceScore: 98,
      h_shift: 0.05,
      v_shift: 0.02,
      expansion: 1.05
    }), 3500);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center p-8 h-[600px] justify-center relative">
      <div className="relative w-80 h-80 rounded-[3rem] border border-[#F1E9DB] bg-white flex items-center justify-center overflow-hidden shadow-medical-lg">
        <ScanFace className="w-28 h-28 text-teal-700/10 absolute" />
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
          <motion.path 
            d="M30,40 Q50,20 70,40 Q80,60 70,80 Q50,95 30,80 Q20,60 30,40 Z" 
            fill="none" stroke="#0D9488" strokeWidth="0.6" strokeDasharray="3 3"
            animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
          />
        </svg>
        <div className="absolute left-0 w-full h-1.5 bg-teal-700 shadow-[0_0_20px_rgba(13,148,136,0.3)]" style={{ top: `${scanLine}%` }} />
      </div>
      <div className="mt-14 text-center w-full max-w-sm">
        <div className="flex justify-between text-[11px] font-bold text-teal-800 mb-4 uppercase tracking-[0.2em]">
          <span>Neural Mapping: CN-VII</span>
          <span>{Math.floor(score)}% Alignment</span>
        </div>
        <div className="h-2.5 bg-[#F9F6F0] rounded-full overflow-hidden shadow-inner border border-[#F1E9DB]">
          <motion.div className="h-full bg-teal-700" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3.5 }} />
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
    <div ref={containerRef} className="flex flex-col items-center p-8 h-[600px] justify-center relative overflow-hidden bg-amber-50/30">
      <div className="absolute top-12 text-center w-full px-6">
         <p className="text-lg font-black text-amber-800 uppercase tracking-[0.2em] animate-pulse">Stability Zone Active</p>
         <p className="text-sm text-amber-600 font-bold mt-2">Maintain calibration by centering the indicator</p>
      </div>
      
      <div className="relative w-[400px] h-[400px] rounded-full border-4 border-amber-200 bg-white shadow-2xl flex items-center justify-center">
        {/* Large fixed target crosshair */}
        <div className="absolute w-full h-[2px] bg-amber-100" />
        <div className="absolute h-full w-[2px] bg-amber-100" />
        
        {/* Concentric rings for depth */}
        <div className="absolute inset-10 rounded-full border-2 border-amber-50" />
        <div className="absolute inset-20 rounded-full border-2 border-amber-50" />
        <div className="absolute inset-[120px] rounded-full border-2 border-amber-100 border-dashed animate-[spin_30s_linear_infinite]" />
        
        <Target className="w-16 h-16 text-amber-600/20 absolute" />
        
        {/* High-visibility tracking indicator */}
        <motion.div 
          className="absolute w-10 h-10 bg-slate-900 rounded-full shadow-[0_0_30px_rgba(15,23,42,0.4)] border-4 border-amber-400 z-20 flex items-center justify-center"
          animate={{ x: mousePos.x - 200, y: mousePos.y - 200 }}
          transition={{ type: "tween", duration: 0.04 }}
        >
          <div className="w-2 h-2 bg-amber-400 rounded-full" />
        </motion.div>

        {/* Dynamic variance lines */}
        <motion.div 
          className="absolute border-2 border-amber-500/30 rounded-full pointer-events-none"
          animate={{ 
            x: mousePos.x - 200, 
            y: mousePos.y - 200,
            width: [40, 60, 40],
            height: [40, 60, 40]
          }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>

      <div className="absolute bottom-12 right-12 text-xs font-black text-slate-700 font-mono text-right space-y-2 bg-white p-6 rounded-[2rem] border-2 border-amber-200 shadow-xl backdrop-blur-md">
        <div className="flex justify-between gap-8 border-b border-amber-100 pb-2">
          <span className="text-amber-600">AXIS_X</span>
          <span>{(mousePos.x - 200).toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-8 border-b border-amber-100 pb-2">
          <span className="text-amber-600">AXIS_Y</span>
          <span>{(mousePos.y - 200).toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-8 pt-1 text-base">
          <span className="text-amber-700 uppercase">Stability</span>
          <span className="text-slate-900">{(100 - Math.abs(mousePos.x - 200)/2.5).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
