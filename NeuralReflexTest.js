import React, { useState, useEffect, useRef } from 'react';
import { Camera, Brain, Activity, Target, ShieldAlert, CheckCircle2, Hand } from 'lucide-react';
import { Hands } from '@mediapipe/hands';
import * as cam from '@mediapipe/camera_utils';

const NeuralReflexTest = ({ onComplete }) => {
  const [testState, setTestState] = useState('idle'); // idle, waiting, ready, results
  const [motorRT, setMotorRT] = useState(0);
  const [gestureRT, setGestureRT] = useState(0);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const startTime = useRef(0);
  const gestureDetected = useRef(false);
  const motorDetected = useRef(false);

  // --- MEDIAPIPE HANDS LOGIC ---
  const processing = useRef(false);
  const frameCount = useRef(0);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      processing.current = false;
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;
      if (testState !== 'ready' || gestureDetected.current) return;

      const landmarks = results.multiHandLandmarks[0];
      
      // Peace Symbol Detection Logic:
      // Index (8) & Middle (12) are extended (tip.y < PIP.y)
      // Ring (16) & Pinky (20) are curled (tip.y > PIP.y)
      
      const isIndexUp = landmarks[8].y < landmarks[6].y;
      const isMiddleUp = landmarks[12].y < landmarks[10].y;
      const isRingDown = landmarks[16].y > landmarks[14].y;
      const isPinkyDown = landmarks[20].y > landmarks[18].y;

      if (isIndexUp && isMiddleUp && isRingDown && isPinkyDown) {
        gestureDetected.current = true;
        setGestureRT(Date.now() - startTime.current);
      }
    });

    if (videoRef.current) {
      const camera = new cam.Camera(videoRef.current, {
        onFrame: async () => {
          frameCount.current++;
          if (frameCount.current % 3 === 0 && !processing.current) {
            processing.current = true;
            await hands.send({ image: videoRef.current });
          }
        },
        width: 320,
        height: 240,
      });
      camera.start();
    }
  }, [testState]);

  // --- TEST CONTROL ---
  const startTest = () => {
    setTestState('waiting');
    gestureDetected.current = false;
    motorDetected.current = false;
    
    const randomDelay = Math.random() * 2000 + 1500;
    setTimeout(() => {
      setTestState('ready');
      startTime.current = Date.now();
    }, randomDelay);
  };

  const handleMotorClick = () => {
    if (testState === 'ready' && !motorDetected.current) {
      motorDetected.current = true;
      setMotorRT(Date.now() - startTime.current);
    }
  };

  useEffect(() => {
    if (gestureDetected.current && motorDetected.current && testState === 'ready') {
      submitToBackend();
    }
  }, [gestureRT, motorRT]);

  const submitToBackend = async () => {
    setLoading(true);
    try {
      // Map 'gestureRT' to 'facial_ms' for existing backend compatibility
      const response = await fetch('http://localhost:8000/analyze_reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motor_ms: motorRT, facial_ms: gestureRT }),
      });
      const data = await response.json();
      setRisks(data);
      setTestState('results');
      
      if (onComplete) {
        setTimeout(() => onComplete({ motor: motorRT, facial: gestureRT, risks: data }), 4000);
      }
    } catch (err) {
      console.error("Backend Error:", err);
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
          {testState === 'waiting' && <p className="animate-pulse text-rose-400 text-xl font-mono">GET READY...</p>}
          {testState === 'ready' && (
            <div 
              onClick={handleMotorClick}
              className="absolute inset-0 bg-emerald-500/80 flex flex-col items-center justify-center cursor-pointer"
            >
              <Target size={64} className="animate-ping" />
              <p className="text-2xl font-black mt-4">SHOW ✌️ & CLICK!</p>
            </div>
          )}
          {testState === 'results' && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
              <CheckCircle2 size={48} className="text-emerald-400 mb-2" />
              <h3 className="text-xl font-bold">Test Complete</h3>
              <p className="text-slate-400 text-sm mt-2">Analysis Complete</p>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-6">Diagnostic Outputs</h3>
          
          {testState !== 'results' ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 italic">
              <Activity className="mb-2 opacity-20" size={48} />
              <p>Run the test to generate risks...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {risks.map((risk, idx) => (
                <div key={idx} className="p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-200">{risk.disease}</span>
                    <span className={`font-mono text-sm ${risk.risk_percentage > 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {risk.risk_percentage}% Risk
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full transition-all duration-1000 ${risk.risk_percentage > 60 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${risk.risk_percentage}%` }}
                    />
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
        </div>
        <ShieldAlert className="text-white/10" size={40} />
      </div>
    </div>
  );
};

export default NeuralReflexTest;
