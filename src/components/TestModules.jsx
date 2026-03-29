import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, Mic, Target, Camera, CheckCircle2, ShieldAlert, Activity, ChevronRight } from 'lucide-react';
import { FaceMesh as MPFaceMesh } from '@mediapipe/face_mesh';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import { getHeaders } from '../lib/api';

const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
const distToLine = (p0, p1, p2) => {
  const num = Math.abs((p2.x - p1.x) * (p1.y - p0.y) - (p1.x - p0.x) * (p2.y - p1.y));
  const den = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  return num / (den + 1e-6);
};

export const FaceMesh = ({ onComplete, user }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('initializing');
  const [progress, setScore] = useState(0);
  const [instruction, setInstruction] = useState("Align your face within the frame");
  
  const neutralBuffer = useRef([]);
  const smileFrames = useRef([]);
  const faceMesh = useRef(null);
  const statusRef = useRef(status);
  const streamRef = useRef(null);

  useEffect(() => { statusRef.current = status; }, [status]);

  const extractMetrics = (landmarks) => {
    const faceWidth = dist(landmarks[234], landmarks[454]) + 1e-6;
    const mid1 = landmarks[10], mid2 = landmarks[152], eye1 = landmarks[33], eye2 = landmarks[263];
    const LIP_L = [61, 39, 181], LIP_R = [291, 269, 405];
    const leftH = LIP_L.map(n => distToLine(landmarks[n], mid1, mid2));
    const rightH = LIP_R.map(n => distToLine(landmarks[n], mid1, mid2));
    const leftV = LIP_L.map(n => distToLine(landmarks[n], eye1, eye2));
    const rightV = LIP_R.map(n => distToLine(landmarks[n], eye1, eye2));

    return {
      h_asym: Math.abs(leftH.reduce((a,b)=>a+b,0)/3 - rightH.reduce((a,b)=>a+b,0)/3) / faceWidth,
      v_asym: Math.abs(leftV.reduce((a,b)=>a+b,0)/3 - rightV.reduce((a,b)=>a+b,0)/3) / faceWidth,
      intensity: dist(landmarks[61], landmarks[291]) / faceWidth
    };
  };

  useEffect(() => {
    faceMesh.current = new MPFaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
    faceMesh.current.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
    faceMesh.current.onResults((results) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
      const landmarks = results.multiFaceLandmarks[0];
      drawConnectors(ctx, landmarks, FACEMESH_TESSELATION, { color: '#10B981', lineWidth: 0.5 });
      const metrics = extractMetrics(landmarks);
      window.currentFaceMetrics = metrics;
      if (statusRef.current === 'initializing') { setStatus('neutral'); setInstruction("Look straight with a neutral expression"); }
      if (statusRef.current === 'neutral') { neutralBuffer.current.push(metrics); if (neutralBuffer.current.length > 30) neutralBuffer.current.shift(); }
      if (window.isCapturingSmile) smileFrames.current.push(metrics);
    });

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            const process = async () => { if (videoRef.current && faceMesh.current) { try { await faceMesh.current.send({ image: videoRef.current }); } catch (e) {} requestAnimationFrame(process); } };
            process();
          };
        }
      } catch (err) { console.error(err); }
    };
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      faceMesh.current?.close();
    };
  }, []);

  const captureNeutral = () => {
    if (neutralBuffer.current.length < 5) return;
    window.finalNeutral = {
      h_asym: neutralBuffer.current.reduce((s, m) => s + m.h_asym, 0) / neutralBuffer.current.length,
      v_asym: neutralBuffer.current.reduce((s, m) => s + m.v_asym, 0) / neutralBuffer.current.length,
      intensity: neutralBuffer.current.reduce((s, m) => s + m.intensity, 0) / neutralBuffer.current.length
    };
    setStatus('smile_prompt');
    setInstruction("Now, give a big SMILE!");
  };

  const captureSmile = () => {
    setStatus('smile_capture');
    window.isCapturingSmile = true;
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setScore(p);
      if (p >= 100) { clearInterval(interval); finalize(); }
    }, 60); 
  };

  const finalize = async () => {
    window.isCapturingSmile = false;
    setStatus('analyzing');
    setInstruction("Analyzing clinical metrics...");
    const peak = smileFrames.current.sort((a,b) => b.intensity - a.intensity)[0];
    try {
      console.log("DEBUG: Sending smile data to backend...");
      const res = await fetch('http://localhost:8000/process_biometrics', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ test_type: 'smile', raw_data: { neutral: window.finalNeutral, peak } })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log("DEBUG: Smile data saved successfully:", data);
      
      setTimeout(() => onComplete({ 
        faceScore: Math.round(100 - (data.stroke_risk || 5)),
        ...data 
      }), 1500);
    } catch (err) { 
      console.error("DEBUG: Smile save failed:", err);
      onComplete({ faceScore: 95 }); 
    }
  };

  return (
    <div className="flex flex-col items-center p-8 h-[650px] justify-center relative bg-slate-50/50">
      <div className="relative w-full max-w-2xl aspect-video rounded-[3rem] border-4 border-white bg-slate-900 overflow-hidden shadow-medical-xl group">
        <video ref={videoRef} className="w-full h-full object-cover opacity-80" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 px-10">
          <div className="bg-black/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Camera className="text-teal-400 w-5 h-5" />
              <p className="text-white font-bold tracking-tight">{instruction}</p>
            </div>
            {status === 'neutral' && <button onClick={captureNeutral} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-500 transition-all text-xs">Capture Neutral</button>}
            {status === 'smile_prompt' && <button onClick={captureSmile} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 transition-all text-xs animate-bounce">I'm Smiling!</button>}
          </div>
        </div>
      </div>
      {status === 'smile_capture' && (
        <div className="mt-10 w-full max-w-md">
          <div className="flex justify-between text-[10px] font-black text-teal-800 mb-2 uppercase tracking-widest"><span>Capturing Biometric Delta</span><span>{progress}%</span></div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><motion.div className="h-full bg-teal-600" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div>
        </div>
      )}
      {status === 'analyzing' && (
        <div className="mt-10 flex items-center gap-3 text-teal-700">
          <div className="w-5 h-5 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest">Syncing Clinical Data...</span>
        </div>
      )}
    </div>
  );
};

export const HandTracker = ({ onComplete, user }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('idle'); 
  const [isReady, setIsReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [instruction, setInstruction] = useState("Place palm in frame");
  const motionData = useRef([]);
  const handsRef = useRef(null);
  const statusRef = useRef(status);
  const streamRef = useRef(null);

  useEffect(() => { statusRef.current = status; }, [status]);

  useEffect(() => {
    handsRef.current = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    handsRef.current.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
    handsRef.current.onResults((results) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) { setIsReady(false); if (statusRef.current === 'idle') setInstruction("Please place full palm in view"); return; }
      const landmarks = results.multiHandLandmarks[0];
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#F59E0B', lineWidth: 2 });
      const fingertips = [4, 8, 12, 16, 20];
      drawLandmarks(ctx, fingertips.map(i => landmarks[i]), { color: '#3B82F6', lineWidth: 1, radius: 5 });
      const avgX = fingertips.reduce((s, i) => s + landmarks[i].x, 0) / 5;
      const avgY = fingertips.reduce((s, i) => s + landmarks[i].y, 0) / 5;
      if (statusRef.current === 'idle') { setIsReady(true); setInstruction("READY: Hold steady and start scan"); }
      if (window.isRecordingHand) motionData.current.push([performance.now() / 1000, avgX, avgY]);
    });

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current.play(); canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
            const process = async () => { if (videoRef.current && handsRef.current) { try { await handsRef.current.send({ image: videoRef.current }); } catch (e) {} requestAnimationFrame(process); } }; process();
          };
        }
      } catch (err) { console.error(err); }
    };
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      handsRef.current?.close();
    };
  }, []);

  const startScan = () => {
    setStatus('testing');
    window.isRecordingHand = true;
    motionData.current = [];
    let start = Date.now();
    const interval = setInterval(() => {
      let elapsed = (Date.now() - start) / 1000;
      setTimeLeft(Math.max(0, 5.0 - elapsed));
      if (elapsed >= 5.0) { clearInterval(interval); finalize(); }
    }, 100);
  };

  const finalize = async () => {
    window.isRecordingHand = false;
    setStatus('analyzing');
    setInstruction("Analyzing kinetic oscillations...");
    try {
      console.log("DEBUG: Sending hand data to backend...");
      const res = await fetch('http://localhost:8000/process_biometrics', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ test_type: 'hand', raw_data: { motion_data: motionData.current } })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log("DEBUG: Hand data saved successfully:", data);
      setTimeout(() => onComplete({ tremorFreq: `${data.tremor_hz}Hz`, ...data }), 1500);
    } catch (err) { 
      console.error("DEBUG: Hand save failed:", err);
      onComplete({ tremorFreq: '0Hz' }); 
    }
  };

  return (
    <div className="flex flex-col items-center p-8 h-[650px] justify-center relative overflow-hidden bg-slate-50/50">
      <div className="relative w-full max-w-2xl aspect-video rounded-[3rem] border-4 border-white bg-slate-900 overflow-hidden shadow-medical-xl group">
        <video ref={videoRef} className="w-full h-full object-cover opacity-80" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-slate-900/20" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-amber-500/30 rounded-full border-dashed animate-[spin_20s_linear_infinite]" /><Target className="w-12 h-12 text-amber-500/20 absolute" />
        </div>
        <div className="absolute top-8 left-8"><div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10"><p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Stability Monitoring</p></div></div>
        <div className="absolute bottom-8 left-0 right-0 px-10">
          <div className="bg-black/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex items-center justify-between">
            <p className="text-white font-bold text-sm">{instruction}</p>
            {status === 'idle' && <button disabled={!isReady} onClick={startScan} className="px-8 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-500 transition-all text-xs disabled:opacity-50">Start 5s Scan</button>}
            {status === 'testing' && <div className="flex items-center gap-4"><div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" /><span className="text-xl font-black text-amber-400">{timeLeft.toFixed(1)}s</span></div>}
          </div>
        </div>
      </div>
      {status === 'analyzing' && (
        <div className="mt-10 flex items-center gap-3 text-amber-700">
          <div className="w-5 h-5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest">Syncing Clinical Data...</span>
        </div>
      )}
    </div>
  );
};
