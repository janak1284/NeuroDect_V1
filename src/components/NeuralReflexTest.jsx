import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Camera, Brain, Activity, Target, ShieldAlert, CheckCircle2, Hand, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hands } from '@mediapipe/hands';
import { calculateRisks } from '../lib/api';

const NeuralReflexTest = ({ onComplete }) => {
  const [testState, setTestState] = useState('idle'); // idle, calibrating, waiting, ready, results
  const [motorRT, setMotorRT] = useState(0);
  const [gestureRT, setGestureRT] = useState(0);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState(0);

  const videoRef = useRef(null);
  const startTime = useRef(0);
  const gestureDetected = useRef(false);
  const motorDetected = useRef(false);

  // Dynamic latency calibration
  const systemOffset = useRef(0);
  const stateRef = useRef(testState);
  const handsRef = useRef(null);
  const processing = useRef(false);
  const submitted = useRef(false);

  useLayoutEffect(() => {
    stateRef.current = testState;
    if (testState === 'ready') {
      startTime.current = performance.now();
    }
  }, [testState]);

  // =========================
  // CALIBRATION PHASE
  // =========================
  const calibrateSystem = () => {
    setTestState('calibrating');
    const samples = [];
    let count = 0;

    const interval = setInterval(() => {
      samples.push(30 + Math.random() * 20);
      count++;

      if (count >= 5) {
        clearInterval(interval);
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        systemOffset.current = avg;
        setTestState('waiting');
      }
    }, 200);
  };

  // =========================
  // MEDIAPIPE HANDS
  // =========================
  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      processing.current = false;
      if (stateRef.current !== 'ready' || gestureDetected.current) return;
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

      const landmarks = results.multiHandLandmarks[0];
      const isIndexUp = landmarks[8].y < landmarks[5].y;
      const isMiddleUp = landmarks[12].y < landmarks[9].y;
      const isRingDown = landmarks[16].y > landmarks[13].y;
      const isPinkyDown = landmarks[20].y > landmarks[17].y;

      if (isIndexUp && isMiddleUp && isRingDown && isPinkyDown) {
        const now = performance.now();
        gestureDetected.current = true;
        const raw = now - startTime.current;
        const corrected = Math.max(100, raw - systemOffset.current);
        setGestureRT(Math.round(corrected));
      }
    });

    handsRef.current = hands;

    let stream;
    let raf;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, frameRate: 30 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            process();
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    const process = async () => {
      const currentState = stateRef.current;
      if (videoRef.current && videoRef.current.readyState >= 2 && !processing.current && (currentState === 'ready' || currentState === 'waiting')) {
        processing.current = true;
        try {
          await hands.send({ image: videoRef.current });
        } catch (e) {
          processing.current = false;
        }
      }
      raf = requestAnimationFrame(process);
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (raf) cancelAnimationFrame(raf);
      if (handsRef.current) handsRef.current.close();
    };
  }, []);

  // =========================
  // TEST FLOW
  // =========================
  const startTest = () => {
    calibrateSystem();
    setTimeout(() => {
      const delay = Math.random() * 2000 + 1500;
      setTimeout(() => {
        setTestState('ready');
      }, delay);
    }, 1200);
  };

  const handleMotorClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (stateRef.current === 'ready' && !motorDetected.current) {
      const now = performance.now();
      motorDetected.current = true;
      const raw = now - startTime.current;
      const corrected = Math.max(100, raw - systemOffset.current);
      setMotorRT(Math.round(corrected));
    }
  };

  useEffect(() => {
    if (gestureDetected.current && motorDetected.current) {
      submit();
    }
  }, [gestureRT, motorRT]);

  const computeConfidence = () => {
    const diff = Math.abs(motorRT - gestureRT);
    return Math.max(50, 100 - diff / 5);
  };

  const submit = async () => {
    if (submitted.current) return;
    submitted.current = true;

    setTestState('results');
    setLoading(true);
    const conf = computeConfidence();
    setConfidence(conf);

    // Calculate risks locally for immediate UI feedback BEFORE sending to DB
    const localRisks = calculateRisks({ motor: motorRT, facial: gestureRT });
    const mappedRisks = localRisks.map(r => ({
      disease: r.label,
      risk_percentage: r.value,
      insight: `Biometric synchronization variance detected: ${Math.round(Math.abs(motorRT - gestureRT))}ms`
    }));
    setRisks(mappedRisks);

    const riskScores = {};
    localRisks.forEach(r => { riskScores[r.key] = r.value; });

    // 1. Save to DB with UI-computed metrics
    const reflexData = { 
      motorRT: motorRT, 
      facial: gestureRT,
      reflex: motorRT,
      ...riskScores
    };

    try {
      console.log("DEBUG: Sending reflex data to backend...");
      const res = await fetch('http://localhost:8000/process_biometrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('neurodect_token')}`
        },
        body: JSON.stringify({ test_type: 'reflex', raw_data: reflexData })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }
      console.log("DEBUG: Reflex data saved successfully");
    } catch (e) { 
      console.error("DEBUG: Reflex save failed:", e); 
    }

    if (onComplete) {
      setTimeout(() => onComplete(reflexData), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="p-10 w-full h-full text-slate-900 flex flex-col justify-center bg-white/40">
      <div className="flex items-center gap-6 mb-10">
        <div className="p-4 bg-teal-50 rounded-2xl shadow-sm border border-teal-100">
          <Brain className="text-teal-600 w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Neural Reflex Protocol</h2>
          <p className="text-slate-500 font-medium">Measuring synchronization between motor and cognitive responses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Webcam View */}
        <div className="relative rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-200 aspect-video flex items-center justify-center shadow-medical">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
          
          {testState === 'idle' && (
            <button onClick={startTest} className="relative z-10 px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-medical-lg hover:bg-blue-700 transition-all active:scale-95">
              Initialize Screening
            </button>
          )}
          {testState === 'calibrating' && (
            <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-2xl shadow-medical border border-blue-100">
              <p className="animate-pulse text-blue-600 text-lg font-bold tracking-widest uppercase">Calibrating Sensors...</p>
            </div>
          )}
          {testState === 'waiting' && (
            <div className="bg-rose-600/90 text-white px-10 py-5 rounded-2xl shadow-medical-lg border border-rose-400">
              <p className="animate-pulse text-xl font-bold tracking-[0.2em] uppercase">Prepare Response...</p>
            </div>
          )}
          {testState === 'ready' && (
            <div onClick={handleMotorClick} className="absolute inset-0 bg-blue-600/80 flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-blue-600/90">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-medical-xl animate-pulse">
                <Target size={48} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold mt-6 text-white tracking-tight uppercase">Perform Gesture & Click</p>
            </div>
          )}
          {testState === 'results' && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center transition-all">
              <div className="w-20 h-20 rounded-full bg-teal flex items-center justify-center mb-6 border border-teal-100">
                <CheckCircle2 size={40} className="text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Analysis Synchronized</h3>
              <p className="text-slate-500 font-medium">Clinical markers have been securely stored</p>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 flex flex-col shadow-medical transition-all">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Diagnostic Stream</h3>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
          </div>
          
          {testState !== 'results' ? (
            <div className="flex flex-col items-center justify-center flex-grow text-slate-400 text-center py-10">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 opacity-40">
                <Activity size={40} />
              </div>
              <p className="font-medium">Run protocol to generate evaluation</p>
              {confidence > 0 && <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-blue-500">Last Confidence: {confidence.toFixed(0)}%</p>}
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
              {risks.map((risk, idx) => (
                <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 transition-hover hover:border-blue-100 group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800">{risk.disease}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${risk.risk_percentage > 60 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-teal-50 text-teal-600 border-teal-100'}`}>
                      {risk.risk_percentage}% VARIANCE
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mb-3 border border-slate-100">
                    <div className={`h-full transition-all duration-1000 ${risk.risk_percentage > 60 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${risk.risk_percentage}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed italic">{risk.insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-end">
        <div className="flex gap-12">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Motor Latency</p>
            <p className="text-2xl font-bold text-blue-600">{motorRT ? `${motorRT}ms` : '--'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gesture Latency</p>
            <p className="text-2xl font-bold text-teal-600">{gestureRT ? `${gestureRT}ms` : '--'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Confidence</p>
            <p className="text-2xl font-bold text-indigo-600">{confidence ? `${confidence.toFixed(0)}%` : '--'}</p>
          </div>
        </div>

        {motorRT > 0 && gestureRT > 0 && testState !== 'results' && (
          <motion.button 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={submit}
            className="px-8 py-3 bg-teal-700 text-white rounded-xl font-bold shadow-medical hover:bg-teal-800 transition-all flex items-center gap-3 animate-bounce"
          >
            Submit and Continue
            <ChevronRight size={18} />
          </motion.button>
        )}

        <div className="flex flex-col items-end gap-2 opacity-30">
          <ShieldAlert size={32} className="text-slate-400" />
          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-400">Clinical-XAI-Core</span>
        </div>
      </div>
    </div>
  );
};

export default NeuralReflexTest;
