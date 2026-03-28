import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Users, ArrowRight, ScanFace } from 'lucide-react';

const Landing = ({ onStart }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className="text-center max-w-5xl z-10 px-4"
  >
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-teal-50 border border-teal-100 mb-10 shadow-sm"
    >
      <ShieldCheck className="w-4 h-4 text-teal-700" />
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-800">Advanced Neurological Evaluation Protocol</span>
    </motion.div>
    
    <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight text-slate-900 leading-[1.05]">
      Precision Diagnostics. <br />
      <span className="text-teal-700">Clinical Certainty.</span>
    </h1>
    
    <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto mb-14 leading-relaxed">
      NeuroDect leverages high-fidelity AI to monitor neurological biomarkers from any device. Secure, clinical-grade screening for Stroke and Parkinson's.
    </p>

    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
      <motion.button 
        onClick={onStart}
        whileHover={{ scale: 1.02, translateY: -2 }} whileTap={{ scale: 0.98 }}
        className="px-10 py-5 bg-teal-700 text-white rounded-[2rem] flex items-center gap-4 shadow-medical-lg hover:bg-teal-800 transition-all font-bold text-lg"
      >
        <span>Initialize Protocol</span>
        <Activity className="w-5 h-5 animate-pulse" />
      </motion.button>
      
      <button className="px-10 py-5 bg-white text-slate-700 border border-[#F1E9DB] rounded-[2rem] flex items-center gap-3 shadow-medical hover:bg-[#F9F6F0] transition-all font-bold text-lg">
        Technical Overview
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto pt-16 border-t border-[#F1E9DB]">
      <div className="bg-white/60 p-6 rounded-3xl border border-blue-100 shadow-sm text-left group hover:bg-white transition-all">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-110 transition-transform">
          <ScanFace className="text-blue-600 w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 mb-2">Facial Asymmetry</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">Detects micro-asymmetries in facial landmarks using MediaPipe, identifying early signs of stroke or nerve dysfunction.</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Active Protocol</span>
        </div>
      </div>

      <div className="bg-white/60 p-6 rounded-3xl border border-amber-100 shadow-sm text-left group hover:bg-white transition-all">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 border border-amber-100 group-hover:scale-110 transition-transform">
          <Activity className="text-amber-600 w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 mb-2">Motor Stability</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">Analyzes hand tremor frequency (FFT) and stability patterns to screen for Parkinson's and Essential Tremors.</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Active Protocol</span>
        </div>
      </div>

      <div className="bg-white/60 p-6 rounded-3xl border border-teal-100 shadow-sm text-left group hover:bg-white transition-all">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4 border border-teal-100 group-hover:scale-110 transition-transform">
          <Users className="text-teal-600 w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 mb-2">Vocal Cadence</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">Extracts acoustic biomarkers (jitter, shimmer) to detect early symptoms of ALS and other motor neuron conditions.</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Active Protocol</span>
        </div>
      </div>

      <div className="bg-white/60 p-6 rounded-3xl border border-indigo-100 shadow-sm text-left group hover:bg-white transition-all">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 border border-indigo-100 group-hover:scale-110 transition-transform">
          <ShieldCheck className="text-indigo-600 w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 mb-2">Neural Reflex</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">Measures cognitive response synchronization between visual stimulus and motor execution latency.</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Active Protocol</span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default Landing;
