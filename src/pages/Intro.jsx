import React from 'react';
import { motion } from 'framer-motion';
import { 
  Leaf, 
  Target, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Microscope,
  Cpu,
  Globe
} from 'lucide-react';

const Intro = ({ onEnter, onViewDashboard }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen w-full bg-[#f0fdf4] flex flex-col items-center justify-center p-8 relative overflow-hidden"
    >
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vw] bg-emerald-100/40 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50vw] h-[50vw] bg-teal-100/40 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl w-full z-10 flex flex-col items-center">
        <div className="text-center mb-16 flex flex-col items-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-100 border border-emerald-200 mb-8 shadow-sm"
          >
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-700">A New Standard in Care</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.95]">
            Democratizing <br />
            <span className="text-emerald-600">Neurology.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
            Leading the transition to proactive neurological monitoring through high-fidelity AI technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 w-full">
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl p-12 rounded-[3rem] border border-emerald-100 shadow-medical flex flex-col items-start"
          >
            <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-200">
              <Target className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Our Mission</h2>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              We are building an early-warning system for neurodegenerative diseases. By mapping subtle biomarkers through common hardware, we enable clinical screening from home.
            </p>
          </motion.div>

          <motion.div 
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-xl p-12 rounded-[3rem] border border-emerald-100 shadow-medical flex flex-col items-start"
          >
            <div className="w-16 h-16 bg-teal-500 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-teal-200">
              <Zap className="text-white w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Our Method</h2>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              Utilizing high-fidelity Computer Vision and Signal Processing, our system analyzes motor execution and facial symmetry in real-time to generate risk profiles.
            </p>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
          <button 
            onClick={onEnter}
            className="px-12 py-6 bg-emerald-600 text-white rounded-[2.5rem] font-bold text-xl shadow-xl shadow-emerald-200/50 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-4 min-w-[280px] justify-center"
          >
            Enter Platform
            <ArrowRight size={24} />
          </button>
          
          <button 
            onClick={onViewDashboard}
            className="px-12 py-6 bg-white text-emerald-700 rounded-[2.5rem] font-bold text-xl border border-emerald-100 shadow-md hover:bg-emerald-50 transition-all min-w-[280px] justify-center flex items-center gap-4"
          >
            <Cpu size={24} />
            System Status
          </button>
        </div>
      </div>

      <footer className="absolute bottom-10 w-full px-12 flex justify-between items-center opacity-40">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <Microscope size={16} className="text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Clinical Research v1.0</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">HIPAA Protected</span>
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">GDG Innovation Division</p>
      </footer>
    </motion.div>
  );
};

export default Intro;
