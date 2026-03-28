import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ScanFace, 
  Activity, 
  Users, 
  ShieldCheck, 
  ChevronRight, 
  PlusCircle,
  Stethoscope,
  Info,
  ArrowUpRight,
  X,
  Target,
  Zap,
  Microscope,
  History,
  Calendar,
  Clock
} from 'lucide-react';
import { GlassContainer } from '../components/UI/UIComponents';
import { getHistory } from '../lib/api';

const ProtocolModal = ({ protocol, onClose }) => {
  if (!protocol) return null;

  const bgAccent = protocol.accent && protocol.accent.includes('text-') 
    ? protocol.accent.replace('text-', 'bg-') 
    : 'bg-teal-600';

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-[#FDFBF7] rounded-[3rem] shadow-2xl border border-[#F1E9DB] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-2 w-full ${bgAccent}`} />
        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-3xl ${protocol.color} flex items-center justify-center border ${protocol.border} shadow-sm`}>
                {protocol.icon}
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{protocol.title}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${protocol.accent} ${protocol.color} border ${protocol.border} mt-2 inline-block`}>
                  {protocol.status} Protocol
                </span>
              </div>
            </div>
            <button onClose={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-4 text-teal-700">
                <Target size={20} />
                <h4 className="text-sm font-black uppercase tracking-widest">What we are implementing</h4>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed font-medium">{protocol.implementation}</p>
            </section>
            <section>
              <div className="flex items-center gap-3 mb-4 text-amber-700">
                <Zap size={20} />
                <h4 className="text-sm font-black uppercase tracking-widest">How we are doing it</h4>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed font-medium">{protocol.methodology}</p>
            </section>
          </div>
          <div className="mt-10 pt-8 border-t border-[#F1E9DB] flex justify-end">
            <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
              Close Details
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DashboardHub = ({ onStartTest, user }) => {
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const data = await getHistory(user.user_id);
    setHistory(data);
    setLoadingHistory(false);
  };

  const protocols = [
    { 
      id: 'facial', title: "Facial Asymmetry", icon: <ScanFace size={32} />, status: "Operational",
      desc: "High-fidelity mapping of cranial nerve biomarkers for early stroke detection.",
      implementation: "Real-time mapping of 468 facial landmarks to detect micro-asymmetries in the nasolabial fold and eyelid drooping.",
      methodology: "Utilizing MediaPipe Face Mesh, we calculate a symmetry index comparing left and right hemifacial expressions.",
      color: "bg-blue-50", border: "border-blue-100", accent: "text-blue-600"
    },
    { 
      id: 'motor', title: "Motor Stability", icon: <Activity size={32} />, status: "Operational",
      desc: "FFT-based tremor analysis for Parkinson's and Essential Tremor identification.",
      implementation: "Precision tracking of hand-eye coordination and involuntary kinetic oscillations.",
      methodology: "We use Fast Fourier Transform (FFT) on coordinate data to isolate tremor frequencies.",
      color: "bg-amber-50", border: "border-amber-100", accent: "text-amber-600"
    },
    { 
      id: 'vocal', title: "Vocal Cadence", icon: <Users size={32} />, status: "Operational",
      desc: "Acoustic jitter and shimmer extraction for motor neuron disease screening.",
      implementation: "Analysis of voice stability, phonation duration, and articulatory speed.",
      methodology: "Captured audio is processed to measure 'jitter' and 'shimmer' in the vocal folds.",
      color: "bg-teal-50", border: "border-teal-100", accent: "text-teal-600"
    },
    { 
      id: 'reflex', title: "Neural Reflex", icon: <ShieldCheck size={32} />, status: "Active",
      desc: "Latency synchronization measurement between cognitive stimuli and motor execution.",
      implementation: "Mapping the neural pathway between visual perception and physical response.",
      methodology: "Randomized stimuli trigger a motor response to measure precise millisecond latency.",
      color: "bg-indigo-50", border: "border-indigo-100", accent: "text-indigo-600"
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl mx-auto p-10">
      <AnimatePresence>
        {selectedProtocol && <ProtocolModal protocol={selectedProtocol} onClose={() => setSelectedProtocol(null)} />}
      </AnimatePresence>

      <div className="flex flex-col items-center text-center mb-16">
        <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center shadow-medical border border-[#F1E9DB] mb-8">
          <Stethoscope className="text-teal-600 w-10 h-10" />
        </div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Diagnostic Command</h2>
        <p className="text-slate-500 font-medium text-lg max-w-xl">
          Welcome to the NeuroDect Control Hub. Select a protocol to review implementation details or begin a screening.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
        {protocols.map((p, idx) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} onClick={() => setSelectedProtocol(p)}>
            <GlassContainer className={`p-10 border-2 ${p.border} hover:shadow-medical-xl transition-all group cursor-pointer relative overflow-hidden h-full flex flex-col`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${p.color} opacity-20 rounded-bl-[5rem] -mr-10 -mt-10`} />
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className={`w-16 h-16 rounded-3xl ${p.color} flex items-center justify-center border ${p.border} shadow-sm text-teal-600`}>
                  {p.icon}
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${p.accent} ${p.color} border ${p.border}`}>
                  {p.status}
                </span>
              </div>
              <div className="relative z-10 flex-grow">
                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-teal-700 transition-colors">{p.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium mb-8 text-lg">{p.desc}</p>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-[#F1E9DB] relative z-10 mt-auto">
                <div className="flex items-center gap-2 text-slate-400">
                  <Info size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Protocol Specs</span>
                </div>
                <ChevronRight size={20} className={`${p.accent} group-hover:translate-x-1 transition-transform`} />
              </div>
            </GlassContainer>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center mb-20">
        <motion.button 
          onClick={onStartTest}
          whileHover={{ scale: 1.02, translateY: -4 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-4 px-12 py-6 bg-teal-700 text-white rounded-[2.5rem] font-black text-xl shadow-xl shadow-teal-200 hover:bg-teal-800 transition-all group"
        >
          <PlusCircle size={28} />
          Initialize New Screening
          <ArrowUpRight size={24} className="opacity-50 group-hover:opacity-100 transition-all" />
        </motion.button>
      </div>

      {/* History Section */}
      <div className="mt-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#F9F6F0] flex items-center justify-center border border-[#F1E9DB] text-teal-700">
            <History size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Clinical History</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chronological Longitudinal Data</p>
          </div>
        </div>

        <GlassContainer className="overflow-hidden border-[#F1E9DB]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F6F0]/60">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#F1E9DB]">Date & Time</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#F1E9DB]">Motor RT</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#F1E9DB]">Gesture RT</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#F1E9DB]">Overall Risk</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#F1E9DB]">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1E9DB]">
                {loadingHistory ? (
                  <tr>
                    <td colSpan="5" className="p-20 text-center text-slate-400 italic font-medium">Synchronizing history...</td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-20 text-center text-slate-400 italic font-medium">No previous screenings found.</td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.session_id} className="hover:bg-[#FDFBF7] transition-colors group">
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{new Date(item.created_at).toLocaleDateString()}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(item.created_at).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="font-mono font-bold text-teal-700">{Math.round(item.reaction_time_ms)}ms</span>
                      </td>
                      <td className="p-6">
                        <span className="font-mono font-bold text-blue-600">{Math.round(item.facial_ms || 0)}ms</span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-grow max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.overall_risk_score > 60 ? 'bg-rose-500' : 'bg-teal-500'}`} 
                              style={{ width: `${item.overall_risk_score}%` }} 
                            />
                          </div>
                          <span className="font-black text-slate-900">{Math.round(item.overall_risk_score)}%</span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <button className="p-2 rounded-lg border border-[#F1E9DB] text-slate-400 hover:text-teal-700 hover:border-teal-200 hover:bg-teal-50 transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassContainer>
      </div>
    </motion.div>
  );
};

export default DashboardHub;
