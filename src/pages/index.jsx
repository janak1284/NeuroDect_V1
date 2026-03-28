import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ActivitySquare } from 'lucide-react';

const Landing = ({ onStart }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -50 }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    className="text-center max-w-4xl z-10"
  >
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
    >
      <Sparkles className="w-4 h-4 text-cyan-400" />
      <span className="text-xs font-mono uppercase tracking-widest text-cyan-300">Next-Gen Early Warning System</span>
    </motion.div>
    
    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white uppercase leading-[1.1]">
      Detect Neurological Risks <br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 animate-gradient-x">
        Before It's Too Late.
      </span>
    </h1>
    
    <p className="text-lg md:text-xl text-slate-400 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
      Transform any browser into a clinical-grade screening tool. Identify early biomarkers for Stroke, Parkinson's, and ALS using just your webcam and microphone.
    </p>

    <motion.button 
      onClick={onStart}
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      className="relative group inline-flex"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500" />
      <div className="relative px-12 py-5 bg-[#030712] rounded-full flex items-center gap-4 border border-white/10">
        <span className="font-mono text-lg font-bold text-white tracking-widest uppercase">Start Scan</span>
        <ActivitySquare className="w-5 h-5 text-cyan-400 group-hover:animate-pulse" />
      </div>
    </motion.button>
  </motion.div>
);

export default Landing;
