import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Terminal, Activity, ScanFace, ChevronRight, ActivitySquare, Ear, Brain, HeartPulse, Microscope } from 'lucide-react';
import { GlassContainer } from './UI/UIComponents';

export const AnalyzingScreen = ({ onComplete, isDataReady }) => {
  const [text, setText] = React.useState("");
  const fullText = "Calibrating Neural Sensors... Analyzing Facial Symmetry... Processing Motor Stability Data... Encrypting Clinical Report...";

  React.useEffect(() => {
    let i = 0;
    const typing = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) i = 0; 
    }, 40);
    return () => clearInterval(typing);
  }, []);

  React.useEffect(() => {
    if (isDataReady) {
      const timeout = setTimeout(onComplete, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isDataReady, onComplete]);

  return (
    <GlassContainer className="max-w-xl w-full p-16 text-center border-[#F1E9DB] relative overflow-hidden">
      <div className="absolute inset-0 bg-[#F9F6F0]/50 -z-10" />
      <div className="w-24 h-24 mx-auto mb-10 relative">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="w-full h-full border-4 border-slate-100 border-t-teal-700 rounded-full" />
        <div className="absolute inset-4 flex items-center justify-center"><Activity className="w-8 h-8 text-teal-700 animate-pulse" /></div>
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">{isDataReady ? "Synthesis Complete" : "Neural Synthesis"}</h2>
      <div className="h-12 text-sm text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
        {isDataReady ? "Biometric matrix compiled. Transitioning to report..." : text}
        {!isDataReady && <span className="inline-block w-1.5 h-4 bg-teal-700 ml-1 animate-pulse" />}
      </div>
    </GlassContainer>
  );
};

export const Dashboard = ({ results }) => {
  if (!results) {
    return (
      <GlassContainer className="max-w-xl w-full p-16 text-center border-[#F1E9DB]">
        <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900">Synchronizing Data...</h2>
        <p className="text-slate-500 mt-2">Biometric data is being analyzed by our clinical AI engine.</p>
      </GlassContainer>
    );
  }

  const { test_results, consensus } = results;

  const testMatrix = [
    { id: 'facial', label: 'Facial Asymmetry', icon: <ScanFace size={18} />, data: test_results?.facial },
    { id: 'audio', label: 'Acoustic Cadence', icon: <Ear size={18} />, data: test_results?.audio },
    { id: 'motor', label: 'Motor Stability', icon: <Activity size={18} />, data: test_results?.motor },
    { id: 'reflex', label: 'Neural Reflex', icon: <Brain size={18} />, data: test_results?.reflex },
  ];

  const diseaseMapping = [
    { name: "Parkinson's Disease", icon: "🧠", key: "parkinsons_risk" },
    { name: "Acute Stroke", icon: "⚡", key: "stroke_risk" },
    { name: "ALS (Bulbar/Motor)", icon: "🧬", key: "als_risk" },
    { name: "Bell's Palsy", icon: "🤝", key: "bells_palsy_risk" }
  ];

  return (
    <div className="flex flex-col gap-10 w-full">
      {/* 1. Clinical Consensus Section (New) */}
      <GlassContainer className="p-10 border-teal-100 bg-white/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><HeartPulse size={120} /></div>
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg text-white"><Microscope size={24} /></div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Fusion Score</h3>
            <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Multi-Modal Algorithmic Consensus</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {consensus?.map((c, idx) => (
            <motion.div 
              key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-3xl bg-[#FDFBF7] border border-[#F1E9DB] shadow-sm relative group hover:border-teal-200 transition-all"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{c.disease}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${c.score > 70 ? 'text-rose-600' : c.score > 40 ? 'text-amber-600' : 'text-teal-700'}`}>{c.score}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Risk</span>
              </div>
              <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${c.score}%` }} transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full ${c.score > 70 ? 'bg-rose-500' : c.score > 40 ? 'bg-amber-500' : 'bg-teal-500'}`} 
                />
              </div>
            </motion.div>
          ))}
        </div>
      </GlassContainer>

      {/* 2. Diagnostic Biomarker Matrix */}
      <GlassContainer className="overflow-hidden border-[#F1E9DB] shadow-medical-xl flex flex-col">
        <div className="p-8 border-b border-[#F1E9DB] bg-[#F9F6F0]/40 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-700 flex items-center justify-center shadow-lg text-white"><ShieldAlert size={24} /></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Diagnostic Biomarker Matrix</h2>
              <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Per-Test Risk Extraction</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#FDFBF7]">
                <th className="p-6 text-left border border-[#F1E9DB]"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol / Disease</span></th>
                {diseaseMapping.map(d => (
                  <th key={d.key} className="p-6 text-center border border-[#F1E9DB]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xl">{d.icon}</span>
                      <span className="text-[10px] font-bold text-slate-700 uppercase">{d.name.split(' ')[0]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {testMatrix.map((test) => (
                <tr key={test.id} className="group hover:bg-[#FDFBF7] transition-colors">
                  <td className="p-6 border border-[#F1E9DB] bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">{test.icon}</div>
                      <span className="font-bold text-slate-800 text-sm">{test.label}</span>
                    </div>
                  </td>
                  {diseaseMapping.map(d => {
                    const risk = test.data?.[d.key] || 5;
                    const colorClass = risk > 70 ? 'text-rose-600' : risk > 40 ? 'text-amber-600' : 'text-teal-600';
                    return (
                      <td key={d.key} className="p-6 border border-[#F1E9DB] text-center bg-white">
                        <span className={`text-lg font-black ${colorClass}`}>{Math.round(risk)}%</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-[#F9F6F0]/40 border-t border-[#F1E9DB] grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-[#F1E9DB] shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-teal-700">
              <Terminal size={18} />
              <h4 className="text-sm font-bold uppercase tracking-widest">Synthesis Methodology</h4>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Consensus scores are derived using a weighted fusion algorithm. Certain protocols (e.g. Facial Asymmetry) carry higher clinical significance for specific conditions (e.g. Stroke) compared to auxiliary motor tasks.
            </p>
          </div>
          <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-amber-700">
              <AlertTriangle size={18} />
              <h4 className="text-sm font-bold uppercase tracking-widest">Clinical Advisory</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              This screening tool is for informational purposes. Scores above 60% represent a clinical variance that warrants professional neurological evaluation.
            </p>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
};
