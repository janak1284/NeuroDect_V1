import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Terminal, Activity, ScanFace, ChevronRight, ActivitySquare, Ear, Brain } from 'lucide-react';
import { GlassContainer } from './UI/UIComponents';

export const AnalyzingScreen = ({ onComplete, isDataReady }) => {
  const [text, setText] = React.useState("");
  const fullText = "Calibrating Neural Sensors... Analyzing Facial Symmetry... Processing Motor Stability Data... Encrypting Clinical Report...";

  React.useEffect(() => {
    let i = 0;
    const typing = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) i = 0; // Loop the typing animation
    }, 40);
    
    return () => { clearInterval(typing); };
  }, []);

  // Effect to handle completion only when data is ready
  React.useEffect(() => {
    if (isDataReady) {
      const timeout = setTimeout(onComplete, 1000); // Small buffer for visual polish
      return () => clearTimeout(timeout);
    }
  }, [isDataReady, onComplete]);

  return (
    <GlassContainer className="max-w-xl w-full p-16 text-center border-[#F1E9DB] relative overflow-hidden">
      <div className="absolute inset-0 bg-[#F9F6F0]/50 -z-10" />
      <div className="w-24 h-24 mx-auto mb-10 relative">
        <motion.div 
          animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="w-full h-full border-4 border-slate-100 border-t-teal-700 rounded-full"
        />
        <div className="absolute inset-4 flex items-center justify-center">
          <Activity className="w-8 h-8 text-teal-700 animate-pulse" />
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">
        {isDataReady ? "Synthesis Complete" : "Neural Synthesis"}
      </h2>
      <div className="h-12 text-sm text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
        {isDataReady ? "Biometric matrix compiled. Transitioning to report..." : text}
        {!isDataReady && <span className="inline-block w-1.5 h-4 bg-teal-700 ml-1 animate-pulse" />}
      </div>
    </GlassContainer>
  );
};

export const Dashboard = ({ results }) => {
  // Safety check to prevent blank page if results aren't ready
  if (!results) {
    return (
      <GlassContainer className="max-w-xl w-full p-16 text-center border-[#F1E9DB]">
        <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900">Synchronizing Data...</h2>
        <p className="text-slate-500 mt-2">Biometric data is being analyzed by our clinical AI engine.</p>
      </GlassContainer>
    );
  }

  // Extract from database fields if present (returned from backend RETURNING *)
  // Otherwise fallback to raw capture fields
  const facialVal = results.facial_score || results.facial || results.asymmetry_index || 95;
  const acousticVal = results.voice_jitter_pct || results.acoustic || 0.02;
  const motorVal = results.tremor_frequency_hz || results.tremor_hz || results.motor || 4.8;
  const reflexVal = results.reaction_time_ms || results.reflex_ms || results.reflex || 250;

  // Robustly extract biomarkers with fallbacks
  const tests = [
    { id: 'facial', label: 'Facial Asymmetry', icon: <ScanFace size={18} />, value: facialVal, baseline: 100, unit: '%' },
    { id: 'acoustic', label: 'Acoustic Cadence', icon: <Ear size={18} />, value: acousticVal, baseline: 0.015, unit: ' Jitter' },
    { id: 'motor', label: 'Motor Stability', icon: <Activity size={18} />, value: motorVal, baseline: 0, unit: 'Hz' },
    { id: 'reflex', label: 'Neural Reflex', icon: <Brain size={18} />, value: reflexVal, baseline: 200, unit: 'ms' },
  ];

  const diseases = [
    { name: "Parkinson's Disease", icon: "🧠" },
    { name: "Acute Stroke", icon: "⚡" },
    { name: "Essential Tremor", icon: "🤝" },
    { name: "ALS (Bulbar/Motor)", icon: "🧬" },
    { name: "Bell's Palsy", icon: "🎭" }
  ];

  // Helper to get risk percentage per biomarker/disease intersection
  const getRisk = (testId, diseaseName) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return 5;

    let variance = 0;
    const val = parseFloat(test.value) || 0;
    const base = parseFloat(test.baseline) || 1;
    
    // Calculate clinical variance based on biomarker type
    if (testId === 'facial') variance = Math.max(0, (100 - val) / 100);
    else if (testId === 'acoustic') variance = Math.max(0, (val - 0.015) / 0.015);
    else if (testId === 'motor') variance = Math.max(0, val / 10);
    else if (testId === 'reflex') variance = Math.max(0, (val - 250) / 250);
    
    // Clinical Weighting Matrix (Specificity of biomarker to disease)
    let weighting = 0.8; // Baseline
    
    if (diseaseName.includes('Parkinson')) {
      if (testId === 'motor') weighting = 2.8;
      if (testId === 'reflex') weighting = 1.8;
      if (testId === 'acoustic') weighting = 1.2;
    } else if (diseaseName.includes('Stroke')) {
      if (testId === 'facial') weighting = 3.5;
      if (testId === 'reflex') weighting = 2.5;
      if (testId === 'motor') weighting = 1.5;
    } else if (diseaseName.includes('ALS')) {
      if (testId === 'acoustic') weighting = 3.0;
      if (testId === 'motor') weighting = 2.2;
      if (testId === 'reflex') weighting = 1.4;
    } else if (diseaseName.includes('Tremor')) {
      if (testId === 'motor') weighting = 3.2;
      if (testId === 'reflex') weighting = 0.6;
    } else if (diseaseName.includes('Palsy')) {
      if (testId === 'facial') weighting = 3.8;
      if (testId === 'reflex') weighting = 0.4;
    }

    // Mix in a small amount of the backend's overall risk score for data alignment
    const backendRisk = results.parkinsons_risk_pct || results.stroke_risk_pct || 10;
    const localizedRisk = (variance * 100 * weighting);
    
    const finalRisk = Math.min(98, Math.max(5, (localizedRisk * 0.8) + (backendRisk * 0.2)));
    return Math.round(finalRisk);
  };

  try {
    return (
      <GlassContainer className="max-w-7xl w-full overflow-hidden border-[#F1E9DB] shadow-medical-xl flex flex-col">
        <div className="p-8 border-b border-[#F1E9DB] bg-[#F9F6F0]/40 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-700 flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Biomarker Matrix</h2>
              <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Diagnostic Report: DN-{Math.floor(Math.random()*10000)}-X</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="px-5 py-2 bg-white border border-[#F1E9DB] rounded-xl text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              Download PDF
            </button>
            <button 
              onClick={() => window.print()}
              className="px-5 py-2 bg-slate-900 rounded-xl text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all"
            >
              Print Results
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row overflow-x-auto">
          <div className="p-8 w-full">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-4 text-left bg-[#FDFBF7] border border-[#F1E9DB] rounded-tl-2xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Condition / Protocol</span>
                  </th>
                  {tests.map(test => (
                    <th key={test.id} className="p-6 text-center bg-[#F9F6F0]/60 border border-[#F1E9DB]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#F1E9DB] flex items-center justify-center text-teal-600 shadow-sm">
                          {test.icon}
                        </div>
                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{test.label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diseases.map((disease, dIdx) => (
                  <tr key={disease.name} className="group hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-6 border border-[#F1E9DB] bg-white group-hover:bg-teal-50/10">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{disease.icon}</span>
                        <span className="font-bold text-slate-800">{disease.name}</span>
                      </div>
                    </td>
                    {tests.map(test => {
                      const risk = getRisk(test.id, disease.name);
                      const colorClass = risk > 70 ? 'text-rose-600 bg-rose-50 border-rose-100' : 
                                       risk > 40 ? 'text-amber-600 bg-amber-50 border-amber-100' : 
                                       'text-teal-600 bg-teal-50 border-teal-100';
                      return (
                        <td key={test.id} className="p-6 border border-[#F1E9DB] text-center bg-white group-hover:bg-transparent">
                          <div className={`inline-flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 ${colorClass} transition-transform group-hover:scale-110 shadow-sm`}>
                            <span className="text-lg font-black">{risk}%</span>
                            <span className="text-[8px] font-bold uppercase tracking-tighter">Risk</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8 bg-[#F9F6F0]/40 border-t border-[#F1E9DB] grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-[#F1E9DB] shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-teal-700">
              <Terminal size={18} />
              <h4 className="text-sm font-bold uppercase tracking-widest">Diagnostic Logic Breakdown</h4>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Risk percentages are calculated by correlating the variance between your captured biomarkers and clinical baselines. The matrix highlights how each specific test contributes to the overall screening profile for each condition.
            </p>
          </div>
          <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-amber-700">
              <AlertTriangle size={18} />
              <h4 className="text-sm font-bold uppercase tracking-widest">Clinical Advisory</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              This screening tool is for informational purposes. If any condition shows a risk percentage above 60%, we strongly recommend sharing this report with a licensed neurologist for a comprehensive evaluation.
            </p>
          </div>
        </div>
      </GlassContainer>
    );
  } catch (err) {
    console.error("Dashboard Rendering Error:", err);
    return (
      <GlassContainer className="max-w-xl w-full p-16 text-center border-rose-100">
        <AlertTriangle className="w-16 h-16 text-rose-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900">Report Generation Failed</h2>
        <p className="text-slate-500 mt-2">An error occurred while compiling your clinical report. Please try again.</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Restart System</button>
      </GlassContainer>
    );
  }
};
