import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Terminal, Activity, ScanFace, ChevronRight, ActivitySquare, User } from 'lucide-react';
import { GlassContainer } from './UI/UIComponents';
import { calculateRisks } from '../lib/api';

export const AnalyzingScreen = ({ onComplete }) => {
  const [text, setText] = React.useState("");
  const fullText = "Compiling Neural Matrix... Processing Biomarkers... Executing XAI Models... Generating Report...";

  React.useEffect(() => {
    let i = 0;
    const typing = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(typing);
    }, 30);
    const timeout = setTimeout(onComplete, 3500);
    return () => { clearInterval(typing); clearTimeout(timeout); };
  }, [onComplete]);

  return (
    <GlassContainer className="max-w-xl w-full p-12 text-center border-cyan-500/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyan-900/10 mix-blend-color-dodge" />
      <motion.div 
        animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        className="w-24 h-24 border-t-2 border-r-2 border-cyan-400 rounded-full mx-auto mb-8 relative shadow-[0_0_30px_rgba(6,182,212,0.5)]"
      >
        <div className="absolute inset-2 border-b-2 border-l-2 border-violet-400 rounded-full animate-reverse-spin" />
      </motion.div>
      <h2 className="text-2xl font-black tracking-widest uppercase text-white mb-4">Analyzing Neural Signals</h2>
      <div className="h-12 font-mono text-sm text-cyan-400/80 max-w-sm mx-auto">
        {text}<span className="animate-pulse">_</span>
      </div>
    </GlassContainer>
  );
};

export const Dashboard = ({ results, user }) => {
  const riskScores = calculateRisks(results);
  const mainRisk = riskScores.reduce((prev, current) => (prev.value > current.value) ? prev : current);

  const CircularProgress = ({ value, label, color }) => {
    const circumference = 2 * Math.PI * 38;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    const subLabel = value > 70 ? 'HIGH RISK' : value > 40 ? 'ELEVATED' : 'NOMINAL';
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="transform -rotate-90 w-full h-full">
            <circle cx="64" cy="64" r="38" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
            <motion.circle 
              cx="64" cy="64" r="38" stroke="currentColor" strokeWidth="4" fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              className={color}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-light text-white">{value}</span>
            <span className="text-xs text-slate-400">%</span>
          </div>
        </div>
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-slate-300 mt-2 text-center">{label}</h4>
        <p className={`text-[10px] mt-1 font-mono px-2 py-0.5 rounded border ${
          value > 70 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 
          value > 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>{subLabel}</p>
      </div>
    );
  };

  return (
    <GlassContainer className="max-w-5xl w-full flex flex-col md:flex-row overflow-hidden border-rose-500/20">
      <div className="md:w-5/12 bg-black/40 p-10 border-r border-white/5 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-transparent" />
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">Risk Summary</h2>
        </div>
        
        <div className="mb-8 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <User className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Patient Profile</div>
            <div className="text-sm font-medium text-slate-200">{user?.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          {riskScores.map((risk, idx) => (
            <CircularProgress key={idx} value={risk.value} label={risk.label} color={risk.color} />
          ))}
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 backdrop-blur-md">
          <h5 className="text-rose-400 font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
            <AlertTriangle size={14} /> Clinical Action Advised
          </h5>
          <p className="text-sm text-rose-200/70 font-light leading-relaxed">
            Biomarker intersection ({results.motor}ms motor latency + {results.facial}ms facial response) indicates potential {mainRisk.label} markers.
          </p>
        </div>
      </div>
      <div className="md:w-7/12 p-10 bg-slate-900/40 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Terminal size={16} /> DiNeuro XAI Breakdown
          </h3>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center group hover:bg-white/10 transition-colors">
              <div>
                <div className="text-emerald-400 font-mono text-xs mb-1">MOTOR LATENCY</div>
                <div className="text-slate-200 text-sm">{results.motor}ms (Baseline: 450ms)</div>
              </div>
              <Activity className={results.motor > 700 ? "text-rose-500" : "text-emerald-500/50"} />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center group hover:bg-white/10 transition-colors">
              <div>
                <div className="text-cyan-400 font-mono text-xs mb-1">FACIAL LATENCY</div>
                <div className="text-slate-200 text-sm">{results.facial}ms (Baseline: 500ms)</div>
              </div>
              <ScanFace className={results.facial > 850 ? "text-rose-500" : "text-cyan-500/50"} />
            </div>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-xs text-slate-500 font-mono">Report ID: DN-{Math.floor(Math.random()*9000)+1000}-X2</p>
          <button className="relative group overflow-hidden rounded-full p-[1px]">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#f43f5e_0%,#3f3f46_50%,#f43f5e_100%)]" />
            <div className="relative bg-slate-950 px-8 py-3 rounded-full flex items-center gap-3 transition-all group-hover:bg-slate-900">
              <span className="font-mono text-sm font-bold text-rose-400 tracking-widest uppercase">Consult Specialist</span>
              <ChevronRight size={16} className="text-rose-400" />
            </div>
          </button>
        </div>
      </div>
    </GlassContainer>
  );
};
