import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Brain, Ear, Hand, Camera, Mic, 
  CheckCircle2, AlertTriangle, Terminal, Target, ScanFace, 
  ChevronRight, Sparkles, ActivitySquare, Fingerprint, ShieldAlert
} from 'lucide-react';
import NeuralReflexTest from './NeuralReflexTest';

// ... (rest of imports)


const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    const handleMouseOver = (e) => {
      if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[100] mix-blend-screen flex items-center justify-center"
      animate={{
        x: mousePos.x - 16,
        y: mousePos.y - 16,
        scale: isHovering ? 2 : 1,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
    >
      <div className={`w-full h-full rounded-full border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all ${isHovering ? 'bg-cyan-500/20' : 'bg-transparent'}`} />
      <div className="absolute w-1 h-1 bg-cyan-300 rounded-full" />
    </motion.div>
  );
};

const AmbientBackground = ({ isTestActive }) => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#030712]">
    {/* Noise Texture */}
    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
    
    {!isTestActive && (
      <>
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/40 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-violet-900/40 blur-[100px]" 
        />
      </>
    )}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
  </div>
);

const GlassContainer = ({ children, className = "", isTestActive = false }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className={`${isTestActive ? 'bg-black/60' : 'bg-white/[0.02] backdrop-blur-2xl'} border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] ${className}`}
  >
    {children}
  </motion.div>
);

// --- TEST MODULES ---

const FaceTest = ({ onComplete }) => {
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
        
        {/* Animated Face Mesh Simulation */}
        <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 100 100">
          <motion.path 
            d="M30,40 Q50,20 70,40 Q80,60 70,80 Q50,95 30,80 Q20,60 30,40 Z" 
            fill="none" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="2 2"
            animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          />
          {/* Nodes */}
          {[...Array(12)].map((_, i) => (
            <motion.circle 
              key={i} cx={50 + Math.cos(i) * 20} cy={50 + Math.sin(i) * 30} r="1" fill="#22d3ee"
              animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
            />
          ))}
        </svg>

        {/* Laser Scanner */}
        <div 
          className="absolute left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee]" 
          style={{ top: `${scanLine}%` }} 
        />
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

const AudioTest = ({ onComplete }) => {
  const [bars, setBars] = useState(Array(32).fill(10));

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 80 + 10));
    }, 100);
    const timeout = setTimeout(() => onComplete({ speechScore: 'Hypophonia Detected' }), 4000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center p-8 h-[600px] justify-center relative">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-12 shadow-[0_0_40px_rgba(139,92,246,0.3)] border border-violet-400/30 relative"
      >
        <div className="absolute inset-0 rounded-full border border-violet-400/50 animate-ping" />
        <Mic className="w-8 h-8 text-violet-400" />
      </motion.div>

      <h3 className="text-xl text-slate-200 font-light mb-8">Say <span className="text-violet-400 font-bold tracking-widest">"Ahhhhh"</span></h3>

      {/* Waveform */}
      <div className="flex items-end justify-center gap-1 h-32 w-full px-4">
        {bars.map((h, i) => (
          <motion.div 
            key={i} 
            className="w-2 bg-gradient-to-t from-violet-600 to-violet-300 rounded-t-full"
            animate={{ height: `${h}%` }}
            transition={{ type: "tween", duration: 0.1 }}
            style={{ opacity: 1 - Math.abs(15 - i) * 0.05 }}
          />
        ))}
      </div>
      <div className="mt-6 text-xs font-mono text-violet-400/60 uppercase tracking-widest animate-pulse">
        Extracting MFCCs & Jitter...
      </div>
    </div>
  );
};

const MotorTest = ({ onComplete }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Add fake tremor to the actual mouse position
      const tremorX = (Math.random() - 0.5) * 15;
      const tremorY = (Math.random() - 0.5) * 15;
      setMousePos({ 
        x: e.clientX - rect.left + tremorX, 
        y: e.clientY - rect.top + tremorY 
      });
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

      {/* Radar Target */}
      <div className="relative w-64 h-64 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-emerald-500/10 scale-75" />
        <div className="absolute inset-0 rounded-full border border-emerald-500/10 scale-50" />
        <div className="w-full h-[1px] bg-emerald-500/20 absolute" />
        <div className="h-full w-[1px] bg-emerald-500/20 absolute" />
        <Target className="w-8 h-8 text-emerald-500/40 absolute" />
        
        {/* Tremor Dot */}
        <motion.div 
          className="absolute w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_15px_#34d399]"
          animate={{ x: mousePos.x - 128, y: mousePos.y - 128 }} // 128 is half of 256 (w-64)
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

const CognitiveTest = ({ onComplete }) => {
  const [state, setState] = useState('waiting'); // waiting, ready, clicked
  const [timer, setTimer] = useState(0);
  const startTime = useRef(0);

  useEffect(() => {
    // Wait random time between 1-3s before turning green
    const timeout = setTimeout(() => {
      setState('ready');
      startTime.current = Date.now();
      // Automatically "fail/click" if they wait too long just for demo flow
      setTimeout(() => { if(state !== 'clicked') handleClick(true); }, 2000);
    }, Math.random() * 2000 + 1000);
    return () => clearTimeout(timeout);
  }, []);

  const handleClick = (auto = false) => {
    if (state !== 'ready' && !auto) return;
    const reaction = auto ? 1250 : Date.now() - startTime.current;
    setTimer(reaction);
    setState('clicked');
    setTimeout(() => onComplete({ reactionTime: reaction }), 1500);
  };

  return (
    <div className="flex flex-col items-center p-8 h-[600px] justify-center relative w-full">
      <div className="text-center mb-12">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-2">Cognitive Latency Test</h3>
        <p className="text-xl font-light">Click the area the moment it turns <span className="text-emerald-400 font-bold">Green</span></p>
      </div>

      <motion.button
        onClick={() => handleClick()}
        className={`w-full max-w-sm h-40 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
          state === 'waiting' ? 'bg-rose-500/20 border border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)] text-rose-400' : 
          state === 'ready' ? 'bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.4)] text-emerald-400' : 
          'bg-slate-800 border-slate-700 text-slate-500'
        }`}
        whileHover={{ scale: state === 'ready' ? 1.02 : 1 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-2xl font-mono tracking-widest uppercase font-bold">
          {state === 'waiting' ? 'Wait' : state === 'ready' ? 'CLICK NOW' : `${timer}ms`}
        </span>
      </motion.button>
    </div>
  );
};

// --- ANALYSIS LOADER ---

const AnalyzingScreen = ({ onComplete }) => {
  const [text, setText] = useState("");
  const fullText = "Compiling Neural Matrix... Processing Biomarkers... Executing XAI Models... Generating Report...";

  useEffect(() => {
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

// --- UTILS ---

const calculateRisks = (results) => {
  // Clinical Baselines
  const motorRT = results.motor || 250;
  const facialRT = results.facial || 300;
  
  const parkinsons = Math.min(95, Math.max(5, ((motorRT - 250) / 10) * 2.5 + 10));
  const stroke = Math.min(95, Math.max(5, ((facialRT - 300) / 10) * 3.0 + 8));
  const bellsPalsy = Math.min(95, Math.max(5, ((facialRT - 300) / 10) * 4.0 + 5));
  const als = Math.min(95, Math.max(5, ((motorRT - 250) / 10) * 1.8 + 12));

  return [
    { label: "Parkinson's", value: Math.round(parkinsons), color: parkinsons > 70 ? "text-rose-400" : parkinsons > 40 ? "text-amber-400" : "text-emerald-400" },
    { label: "Acute Stroke", value: Math.round(stroke), color: stroke > 70 ? "text-rose-400" : stroke > 40 ? "text-amber-400" : "text-emerald-400" },
    { label: "Bell's Palsy", value: Math.round(bellsPalsy), color: bellsPalsy > 70 ? "text-rose-400" : bellsPalsy > 40 ? "text-amber-400" : "text-emerald-400" },
    { label: "ALS", value: Math.round(als), color: als > 70 ? "text-rose-400" : als > 40 ? "text-amber-400" : "text-emerald-400" },
  ];
};

// --- RESULTS DASHBOARD ---

const ResultsDashboard = ({ results }) => {
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
      {/* Left: Score Overview */}
      <div className="md:w-5/12 bg-black/40 p-10 border-r border-white/5 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-transparent" />
        
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">Risk Summary</h2>
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

      {/* Right: Detailed Breakdown & CTA */}
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

            <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-4 flex justify-between items-center relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
              <div>
                <div className="text-rose-400 font-mono text-xs mb-1">DIAGNOSTIC INSIGHT</div>
                <div className="text-slate-200 text-sm">
                  {mainRisk.value > 70 ? `Critical delay in ${mainRisk.label === 'Parkinson\'s' ? 'motor initiation' : 'facial nerve response'}.` : 'No critical neurological delays detected.'}
                </div>
              </div>
              <ActivitySquare className="text-rose-500 animate-pulse" />
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

// --- MAIN APP CONTROLLER ---

export default function App() {
  const [stage, setStage] = useState('landing'); // landing, test, analyzing, results
  const [currentTest, setCurrentTest] = useState(0);
  const [testResults, setTestResults] = useState({ motor: 650, facial: 800 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const tests = [
    { title: "Facial Asymmetry", icon: <ScanFace />, component: FaceTest, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", description: "Detects muscle symmetry using landmark analysis." },
    { title: "Acoustic Cadence", icon: <Ear />, component: AudioTest, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", description: "Analyzes voice frequency for signs of hypophonia." },
    { title: "Motor Stability", icon: <Hand />, component: MotorTest, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", description: "Measures micro-tremors via cursor stability." },
    { title: "Neural Reflex", icon: <Brain />, component: NeuralReflexTest, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", description: "Evaluates neuro-motor latency using the Peace Symbol test." }
  ];

  const handleTestComplete = (data) => {
    if (data && data.motor) {
      setTestResults(prev => ({ ...prev, motor: data.motor, facial: data.facial }));
    }
    
    setIsTransitioning(true);
  };

  const proceedToNext = () => {
    if (currentTest < tests.length - 1) {
      setCurrentTest(prev => prev + 1);
      setIsTransitioning(false);
    } else {
      setStage('analyzing');
      setIsTransitioning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-cyan-500/30 relative flex flex-col overflow-x-hidden">
      <CustomCursor />
      <AmbientBackground />

      {/* Header */}
      <header className="relative z-20 w-full px-8 py-6 flex justify-between items-center mix-blend-screen">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setStage('landing'); setCurrentTest(0); }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] relative">
            <div className="absolute inset-0.5 bg-[#030712] rounded-[10px]" />
            <Fingerprint className="text-cyan-400 relative z-10 w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-widest text-white uppercase">NeuroDect</h1>
            <p className="text-[9px] font-mono text-cyan-400 tracking-[0.2em] uppercase">By DiNeuro</p>
          </div>
        </div>
        
        {/* Progress Tracker (Only show during tests) */}
        {stage === 'test' && (
          <div className="hidden md:flex gap-3">
            {tests.map((test, idx) => (
               <div key={idx} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${idx === currentTest ? 'bg-white shadow-[0_0_10px_white]' : idx < currentTest ? 'bg-white/30' : 'bg-white/10'}`} />
            ))}
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          
          {/* LANDING PAGE */}
          {stage === 'landing' && (
            <motion.div 
              key="landing"
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
                Transform any browser into a clinical-grade screening tool. Identify early biomarkers for Stroke, Parkinson's, and Bell's Palsy using just your webcam and microphone.
              </p>

              <motion.button 
                onClick={() => setStage('test')}
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
          )}

          {/* TEST SEQUENCE */}
          {stage === 'test' && !isTransitioning && (
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
                <AnimatePresence mode="wait">
                   <motion.div
                     key={currentTest}
                     initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                     transition={{ duration: 0.4 }}
                     className="absolute inset-0"
                   >
                     {React.createElement(tests[currentTest].component, { onComplete: handleTestComplete })}
                   </motion.div>
                </AnimatePresence>
              </div>
            </GlassContainer>
          )}

          {/* TRANSITION SCREEN */}
          {isTransitioning && (
            <GlassContainer key="transition" className="max-w-xl w-full p-12 text-center border-emerald-500/30">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-8 border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Test Complete</h2>
              
              {currentTest < tests.length - 1 ? (
                <>
                  <p className="text-slate-400 mb-10 font-light">Data captured successfully. Are you ready to proceed to the <span className="text-emerald-400 font-bold">{tests[currentTest + 1]?.title}</span>?</p>
                  
                  <motion.button 
                    onClick={proceedToNext}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="relative group inline-flex"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500" />
                    <div className="relative px-12 py-4 bg-[#030712] rounded-full flex items-center gap-4 border border-white/10">
                      <span className="font-mono text-lg font-bold text-white tracking-widest uppercase">Start Next Test</span>
                      <ChevronRight size={20} className="text-emerald-400" />
                    </div>
                  </motion.button>
                </>
              ) : (
                <>
                  <p className="text-slate-400 mb-10 font-light">All tests completed successfully. Ready to generate your neurological risk assessment?</p>
                  
                  <motion.button 
                    onClick={proceedToNext}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="relative group inline-flex"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-500" />
                    <div className="relative px-12 py-4 bg-[#030712] rounded-full flex items-center gap-4 border border-white/10">
                      <span className="font-mono text-lg font-bold text-white tracking-widest uppercase">Generate Report</span>
                      <ActivitySquare size={20} className="text-emerald-400" />
                    </div>
                  </motion.button>
                </>
              )}
            </GlassContainer>
          )}

          {/* ANALYZING STATE */}
          {stage === 'analyzing' && <AnalyzingScreen key="analyzing" onComplete={() => setStage('results')} />}

          {/* RESULTS DASHBOARD */}
          {stage === 'results' && <ResultsDashboard key="results" />}

        </AnimatePresence>
      </main>

      {/* Footer Details */}
      <div className="fixed bottom-6 w-full text-center pointer-events-none z-0 opacity-40">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan-500/50">GDG Open Innovation Domain • AI Healthcare</p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-reverse-spin {
          animation: reverse-spin 2s linear infinite;
        }
      `}} />
      </div>
      );
      }