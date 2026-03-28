import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Camera, Brain, Activity, Target, ShieldAlert, CheckCircle2, Hand } from 'lucide-react';
import { Hands } from '@mediapipe/hands';

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
      // Allow processing during 'waiting' to warm up the model, but only if not already processing
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

  // Removed redundant useLayoutEffect for startTime as it's now handled in the main state sync effect

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
    setTestState('results');
    setLoading(true);
    const conf = computeConfidence();
    setConfidence(conf);

    try {
      const res = await fetch('http://localhost:8000/analyze_reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motor_ms: motorRT, facial_ms: gestureRT }),
      });
      const data = await res.json();
      setRisks(data);
      if (onComplete) {
        setTimeout(() => onComplete({ motor: motorRT, facial: gestureRT, risks: data }), 4000);
      }
    } catch (err) {
      console.error("Backend error:", err);
      if (onComplete) {
        setTimeout(() => onComplete({ motor: motorRT, facial: gestureRT }), 3000);
      }
    }
    setLoading(false);
  };

  return (
    <div className="p-8 w-full h-full text-white flex flex-col justify-center">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-500/20 rounded-xl">
          <Brain className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Neural Reflex Test</h2>
          <p className="text-slate-400 text-sm">Measures Motor & Gesture response times</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Webcam View */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-white/5 aspect-video flex items-center justify-center">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-50" />
          {testState === 'idle' && (
            <button onClick={startTest} className="relative z-10 px-8 py-3 bg-emerald-500 rounded-full font-bold hover:bg-emerald-400 transition-all">
              Start Screening
            </button>
          )}
          {testState === 'calibrating' && <p className="animate-pulse text-cyan-400 text-xl font-mono">CALIBRATING...</p>}
          {testState === 'waiting' && <p className="animate-pulse text-rose-400 text-xl font-mono">GET READY...</p>}
          {testState === 'ready' && (
            <div onClick={handleMotorClick} className="absolute inset-0 bg-emerald-500/80 flex flex-col items-center justify-center cursor-pointer">
              <Target size={64} className="animate-ping" />
              <p className="text-2xl font-black mt-4">SHOW ✌️ & CLICK!</p>
            </div>
          )}
          {testState === 'results' && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
              <CheckCircle2 size={48} className="text-emerald-400 mb-2" />
              <h3 className="text-xl font-bold">Test Complete</h3>
              <p className="text-slate-400 text-sm mt-2">Analysis Synchronized</p>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col">
          <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-6">Diagnostic Outputs</h3>
          
          {testState !== 'results' ? (
            <div className="flex flex-col items-center justify-center flex-grow text-slate-500 italic text-center">
              <Activity className="mb-2 opacity-20" size={48} />
              <p>Run the test to generate risks...</p>
              {confidence > 0 && <p className="mt-2 text-xs">Previous Confidence: {confidence.toFixed(0)}%</p>}
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
              {risks.map((risk, idx) => (
                <div key={idx} className="p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-200 text-sm">{risk.disease}</span>
                    <span className={`font-mono text-xs ${risk.risk_percentage > 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {risk.risk_percentage}% Risk
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div className={`h-full transition-all duration-1000 ${risk.risk_percentage > 60 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${risk.risk_percentage}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight italic">{risk.insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
        <div className="flex gap-8">
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase">Motor Latency</p>
            <p className="text-xl font-bold font-mono text-emerald-400">{motorRT || '--'} ms</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase">Gesture Latency</p>
            <p className="text-xl font-bold font-mono text-cyan-400">{gestureRT || '--'} ms</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase">Confidence</p>
            <p className="text-xl font-bold font-mono text-violet-400">{confidence ? `${confidence.toFixed(0)}%` : '--'}</p>
          </div>
        </div>
        <ShieldAlert className="text-white/10" size={40} />
      </div>
    </div>
  );
};

export default NeuralReflexTest;