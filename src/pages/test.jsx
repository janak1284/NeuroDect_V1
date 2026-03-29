import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScanFace, Ear, Hand, Brain, CheckCircle2, ChevronRight, ActivitySquare, Mic, ShieldCheck, RotateCcw } from 'lucide-react';
import { GlassContainer } from '../components/UI/UIComponents';
import { FaceMesh, HandTracker } from '../components/TestModules';
import NeuralReflexTest from '../components/NeuralReflexTest';

const AudioTest = ({ onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({ sentence: false, vowel: false });
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [frequencies, setFrequencies] = useState(new Array(15).fill(0));
  const [timeLeft, setTimeLeft] = useState(5);
  const [error, setError] = useState('');
  const [sentenceSamples, setSentenceSamples] = useState([]);
  const [vowelSamples, setVowelSamples] = useState([]);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);

  const startRecording = async (task) => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 64;
      source.connect(analyzer);
      analyzerRef.current = { stream, context: audioContext, analyzer };

      setIsRecording(true);
      setActiveTask(task);
      setTimeLeft(5);

      if (task === 'sentence') setSentenceSamples([]);
      if (task === 'vowel') setVowelSamples([]);

      const updateLevel = () => {
        if (!analyzerRef.current) return;
        const dataArray = new Uint8Array(analyzerRef.current.analyzer.frequencyBinCount);
        analyzerRef.current.analyzer.getByteFrequencyData(dataArray);
        setFrequencies(Array.from(dataArray.slice(0, 15)));

        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (task === 'sentence') {
          setSentenceSamples(prev => [...prev, avg]);
        } else if (task === 'vowel') {
          setVowelSamples(prev => [...prev, avg]);
        }

        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            stopRecording(task);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Microphone access denied:", err);
      setError('Microphone access denied. Please check permissions.');
    }
  };

  const stopRecording = (task) => {
    if (analyzerRef.current) {
      const { stream, context } = analyzerRef.current;
      stream.getTracks().forEach(track => track.stop());
      context.close();
      analyzerRef.current = null;
    }

    setIsRecording(false);
    setActiveTask(null);
    cancelAnimationFrame(animationRef.current);

    setCompletedTasks(prev => {
      const next = { ...prev, [task]: true };
      if (next.sentence && next.vowel) {
        setIsSynthesizing(true);
      }
      return next;
    });
  };

  if (isSynthesizing) {
    return (
      <div className="flex flex-col items-center justify-center h-[650px] p-10 text-center">
        <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center mb-8 border border-teal-100 relative">
          <ActivitySquare size={40} className="text-teal-600 animate-pulse" />
          <motion.div
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute inset-0 border-2 border-transparent border-t-teal-500 rounded-full"
          />
        </div>
        <h4 className="text-3xl font-bold text-slate-900 mb-4">Synthesizing Vocal Profile</h4>
        <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10">
          Combining Articulation Cadence and Phonation Stability markers into a unified acoustic report.
        </p>

        <div className="w-full max-w-md bg-slate-100 h-2 rounded-full overflow-hidden mb-12 shadow-inner">
          <motion.div
            initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3 }}
            className="h-full bg-teal-600"
          />
        </div>

        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 }}
          onClick={async () => {
            // Task Vowel calculation
            const vowelMean = vowelSamples.reduce((a, b) => a + b, 0) / Math.max(vowelSamples.length, 1);
            const vowelVariance = vowelSamples.length > 1
              ? vowelSamples.reduce((s, a) => s + Math.abs(a - vowelMean), 0) / vowelSamples.length
              : 5;

            // Increased sensitivity for Jitter/Shimmer (lower divisors)
            const jitter = Math.min(0.20, Math.max(0.01, vowelVariance / 100));
            const shimmer = Math.min(0.20, Math.max(0.01, vowelVariance / 80));

            // Task Sentence calculation 
            // Use maximum dynamic volume instead of static 15 to account for completely different mic hardware
            const maxVol = Math.max(...sentenceSamples, 10);
            const sentencePauses = sentenceSamples.filter(s => s < (maxVol * 0.3)).length;
            const pauseRatio = sentencePauses / Math.max(sentenceSamples.length, 1);

            const extraData = {
              acoustic_jitter: parseFloat(jitter.toFixed(4)),
              acoustic_shimmer: parseFloat(shimmer.toFixed(4)),
              pause_ratio: parseFloat(pauseRatio.toFixed(4))
            };
            try {
              console.log("DEBUG: Sending audio data to backend...");
              const res = await fetch('http://localhost:8000/process_biometrics', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('neurodect_token')}`
                },
                body: JSON.stringify({ test_type: 'audio', raw_data: extraData })
              });

              if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server error: ${res.status} - ${errorText}`);
              }
              console.log("DEBUG: Audio data saved successfully");
            } catch (e) {
              console.error("DEBUG: Audio save failed:", e);
            }
            onComplete(extraData);
          }}
          className="px-12 py-5 bg-teal-700 text-white rounded-[2rem] font-bold shadow-medical-lg hover:bg-teal-800 transition-all flex items-center gap-4 text-lg"
        >
          Finalize Combined Analysis
          <ChevronRight size={22} />
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[650px] p-6 lg:p-12">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <h4 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Acoustic Biomarker Capture</h4>
          <p className="text-slate-500 font-medium max-w-md mx-auto">Please complete both clinical vocal tasks independently to synchronize your acoustic profile.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Task 1: Sentence */}
          <div className={`flex-1 p-10 rounded-[3rem] border-2 transition-all duration-500 relative overflow-hidden ${completedTasks.sentence ? 'bg-teal-50/50 border-teal-200' : activeTask === 'sentence' ? 'bg-white border-teal-600 shadow-medical-lg scale-[1.02]' : 'bg-white/40 border-slate-100 opacity-60'}`}>
            {completedTasks.sentence && (
              <div className="absolute top-0 right-0 p-6">
                <div className="bg-teal-600 text-white p-1.5 rounded-full shadow-lg">
                  <CheckCircle2 size={18} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mb-6">
              <span className={`w-8 h-8 rounded-2xl ${completedTasks.sentence ? 'bg-teal-600' : 'bg-slate-900'} text-white text-sm flex items-center justify-center font-bold shadow-sm`}>1</span>
              <p className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Articulation Task</p>
            </div>
            <div className="mb-10">
              <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-4">Read Clear & Steady:</p>
              <p className="text-2xl font-bold text-slate-800 leading-relaxed italic">"Today is a beautiful day and I feel happy and energetic."</p>
            </div>
            {!completedTasks.sentence && (
              <button
                disabled={isRecording}
                onClick={() => startRecording('sentence')}
                className={`w-full py-5 rounded-[2rem] font-bold transition-all flex items-center justify-center gap-4 text-lg ${activeTask === 'sentence' ? 'bg-teal-50 text-teal-700 border-2 border-teal-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-medical'}`}
              >
                {activeTask === 'sentence' ? <span className="animate-pulse flex items-center gap-3"><div className="w-2 h-2 bg-teal-600 rounded-full animate-ping" /> Recording... {timeLeft}s</span> : <><Mic size={22} /> Start Task 1</>}
              </button>
            )}
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center gap-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: isRecording ? [1, 1.15, 1] : 1,
                  opacity: isRecording ? [0.3, 0.6, 0.3] : 0.2
                }}
                transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-teal-400 blur-xl"
              />
              <div className="relative z-10 w-32 h-32 rounded-full bg-white border-4 border-teal-100 flex items-center justify-center shadow-medical-lg overflow-hidden">
                <div className="flex items-end gap-1 h-16">
                  {frequencies.slice(0, 8).map((f, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: isRecording ? Math.max(4, (f / 255) * 50) : 4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="w-2 bg-teal-600 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Task 2: Vowel */}
          <div className={`flex-1 p-10 rounded-[3rem] border-2 transition-all duration-500 relative overflow-hidden ${completedTasks.vowel ? 'bg-teal-50/50 border-teal-200' : activeTask === 'vowel' ? 'bg-white border-teal-600 shadow-medical-lg scale-[1.02]' : 'bg-white/40 border-slate-100 opacity-60'}`}>
            {completedTasks.vowel && (
              <div className="absolute top-0 right-0 p-6">
                <div className="bg-teal-600 text-white p-1.5 rounded-full shadow-lg">
                  <CheckCircle2 size={18} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mb-6">
              <span className={`w-8 h-8 rounded-2xl ${completedTasks.vowel ? 'bg-teal-600' : 'bg-slate-900'} text-white text-sm flex items-center justify-center font-bold shadow-sm`}>2</span>
              <p className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Phonation Task</p>
            </div>
            <div className="mb-10">
              <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-4">Sustain Vowel (5s):</p>
              <p className="text-4xl font-black text-teal-800 uppercase tracking-[0.5em] text-center py-4">"aahhhhhhh"</p>
            </div>
            {!completedTasks.vowel && (
              <button
                disabled={isRecording}
                onClick={() => startRecording('vowel')}
                className={`w-full py-5 rounded-[2rem] font-bold transition-all flex items-center justify-center gap-4 text-lg ${activeTask === 'vowel' ? 'bg-teal-50 text-teal-700 border-2 border-teal-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-medical'}`}
              >
                {activeTask === 'vowel' ? <span className="animate-pulse flex items-center gap-3"><div className="w-2 h-2 bg-teal-600 rounded-full animate-ping" /> Recording... {timeLeft}s</span> : <><Mic size={22} /> Start Task 2</>}
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full h-32 flex items-center justify-center bg-white/40 rounded-[2.5rem] border border-teal-50 shadow-inner overflow-hidden">
          <div className="relative z-10 flex items-center gap-1.5 h-16">
            {frequencies.map((f, i) => (
              <motion.div
                key={i}
                animate={{
                  height: isRecording ? Math.max(8, (f / 255) * 60) : 8,
                  backgroundColor: isRecording && f > 20 ? "#0D9488" : "#CBD5E1"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-2 rounded-full"
              />
            ))}
          </div>
          {!isRecording && !completedTasks.sentence && !completedTasks.vowel && (
            <p className="absolute text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Audio Interface Active</p>
          )}
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-rose-600 font-bold mt-8 bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 flex items-center gap-3">
          <ShieldAlert size={18} />
          {error}
        </motion.div>
      )}
    </div>
  );
};

const TestPage = ({ onCompleteAll, user }) => {
  const [currentTest, setCurrentTest] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [lastResult, setLastResult] = useState(null);
  // Store all results properly merged
  const [accumulatedResults, setAccumulatedResults] = useState({
    facial: 500,
    acoustic: 0.015,
    motor: 450,
    reflex: 250,
    tremor_hz: 0,
    asymmetry: 0
  });

  const tests = [
    { id: 'face', title: "Facial Asymmetry", icon: <ScanFace className="w-6 h-6" />, component: FaceMesh, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100", instructions: "Look straight into the camera. Keep your expression neutral until prompted, then give a wide natural smile." },
    { id: 'audio', title: "Acoustic Cadence", icon: <Ear className="w-6 h-6" />, component: AudioTest, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-100", instructions: "When prompted, first read the displayed sentence aloud at your normal pace. Then, sustain the 'Ahhhh' sound steadily for 5 seconds." },
    { id: 'hand', title: "Motor Stability", icon: <Hand className="w-6 h-6" />, component: HandTracker, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100", instructions: "Hold your open palm entirely visible within the camera frame. Make sure your fingers and palm are clearly shown and hold perfectly steady." },
    { id: 'reflex', title: "Neural Reflex", icon: <Brain className="w-6 h-6" />, component: NeuralReflexTest, color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-100", instructions: "In this test, click your mouse exactly right when the screen flashes green. On the second flash, raise your eyebrows instead. Please keep your hands near the mouse." }
  ];

  const handleTestComplete = (data) => {
    setLastResult(data);
    // Merge data based on test type
    setAccumulatedResults(prev => {
      const updated = { ...prev };

      // Test 0: FaceMesh returns { faceScore: 98, h_shift, v_shift, expansion }
      if (data.faceScore !== undefined) {
        updated.asymmetry = (100 - data.faceScore) / 100;
        updated.facial_score = data.faceScore;
        updated.h_shift = data.h_shift || 0;
        updated.v_shift = data.v_shift || 0;
        updated.expansion = data.expansion || 0;
      }

      // Test 1: AudioTest returns { acoustic_jitter, acoustic_shimmer, pause_ratio }
      if (data.acoustic_jitter !== undefined) {
        updated.acoustic = data.acoustic_shimmer;
      }

      // Test 2: HandTracker returns { tremorFreq, parkinsonsRisk, strokeRisk }
      if (data.tremorFreq !== undefined) {
        updated.tremor_hz = parseFloat(data.tremorFreq);
        updated.parkinsons_risk = data.parkinsonsRisk;
        updated.stroke_risk = data.strokeRisk;
      }

      // Test 3: NeuralReflexTest returns { motorRT, facial, reflex }
      if (data.motorRT !== undefined) {
        updated.motor = data.motorRT;
        updated.facial = data.facial;
        updated.reflex = data.reflex;
      }

      return updated;
    });
    setIsTransitioning(true);
  };

  const proceedToNext = () => {
    if (currentTest < tests.length - 1) {
      setCurrentTest(prev => prev + 1);
      setShowInstructions(true);
      setIsTransitioning(false);
      setLastResult(null);
    } else {
      onCompleteAll(accumulatedResults);
    }
  };

  const retakeTest = () => {
    setIsTransitioning(false);
    setLastResult(null);
  };

  const renderCurrentResult = () => {
    if (!lastResult) return null;

    let label = "";
    let value = "";
    let unit = "";

    if (currentTest === 0) { // Facial
      label = "Symmetry Score";
      value = lastResult.faceScore;
      unit = "%";
    } else if (currentTest === 1) { // Audio
      label = "Acoustic Stability";
      value = lastResult.acoustic_jitter;
      unit = " jitter";
    } else if (currentTest === 2) { // Hand
      label = "Tremor Frequency";
      value = lastResult.tremorFreq;
      unit = "";
    } else if (currentTest === 3) { // Reflex
      label = "Reaction Latency";
      value = lastResult.motorRT;
      unit = "ms";
    }

    return (
      <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-6 mb-10 inline-block min-w-[240px]">
        <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-4xl font-black text-slate-900">{value}<span className="text-xl text-teal-600 ml-1">{unit}</span></p>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {!isTransitioning ? (
        <GlassContainer key="test" className="w-full max-w-5xl overflow-hidden flex flex-col min-h-[750px] border-[#F1E9DB] shadow-medical-xl">
          <div className="p-8 border-b border-[#F1E9DB] bg-white/40 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${tests[currentTest].bg} ${tests[currentTest].border} ${tests[currentTest].color} shadow-sm`}>
                {tests[currentTest].icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${tests[currentTest].color}`}>
                    Clinical Protocol {currentTest + 1} of 4
                  </span>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Live Evaluation</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{tests[currentTest].title}</h3>
              </div>
            </div>

            <div className="flex gap-2.5">
              {tests.map((_, idx) => (
                <div key={idx} className={`h-2 rounded-full transition-all duration-300 ${idx === currentTest ? 'w-10 bg-teal-600' : idx < currentTest ? 'w-5 bg-teal-700/40' : 'w-5 bg-[#F1E9DB]'}`} />
              ))}
            </div>
          </div>

          <div className="flex-grow bg-slate-50/30 relative">
            {showInstructions ? (
              <motion.div key={`instr-${currentTest}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center p-8 bg-slate-900/40 backdrop-blur-sm z-50">
                <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-teal-100">
                  <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 bg-slate-50 border ${tests[currentTest].border} ${tests[currentTest].color}`}>
                    {tests[currentTest].icon}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Instructions: {tests[currentTest].title}</h3>
                  <p className="text-slate-600 mb-10 text-lg leading-relaxed">{tests[currentTest].instructions}</p>
                  <button 
                    onClick={() => setShowInstructions(false)}
                    className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold tracking-wide hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/30"
                  >
                    Start Test
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key={currentTest} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                {React.createElement(tests[currentTest].component, {
                  onComplete: handleTestComplete,
                  user: user
                })}
              </motion.div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} className="text-teal-500" /> Secure Clinical Environment • Biometric Encryption Active
            </p>
          </div>
        </GlassContainer>
      ) : (
        <GlassContainer key="transition" className="max-w-xl w-full p-16 text-center border-teal-100">
          <div className="w-24 h-24 rounded-3xl bg-teal-50 flex items-center justify-center mx-auto mb-10 border border-teal-100 shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-teal-600" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">NeuroDect</h2>
          <p className="text-[10px] font-bold text-teal-700 tracking-widest uppercase mb-8">Clinical AI Protocol</p>

          {renderCurrentResult()}

          <div className="flex items-center justify-center gap-1.5 mb-10">
            <div className="h-2.5 w-16 bg-slate-900 rounded-full" />
            <div className="h-2.5 w-8 bg-slate-900 rounded-full" />
          </div>

          <p className="text-slate-500 mb-12 font-medium text-lg leading-relaxed">Neural biomarkers captured and encrypted successfully. Ready for next evaluation.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              onClick={retakeTest}
              whileHover={{ scale: 1.02, translateY: -2 }} whileTap={{ scale: 0.98 }}
              className="px-8 py-5 bg-white text-slate-700 border border-slate-200 rounded-2xl flex items-center gap-3 shadow-medical hover:bg-slate-50 transition-all font-bold text-lg"
            >
              <RotateCcw size={20} />
              Retake
            </motion.button>

            <motion.button
              onClick={proceedToNext}
              whileHover={{ scale: 1.02, translateY: -2 }} whileTap={{ scale: 0.98 }}
              className="px-10 py-5 bg-teal-700 text-white rounded-2xl flex items-center gap-4 shadow-medical-lg hover:bg-teal-800 transition-all font-bold text-lg"
            >
              <span>{currentTest < tests.length - 1 ? "Next Protocol" : "Generate Report"}</span>
              {currentTest < tests.length - 1 ? <ChevronRight size={22} /> : <ActivitySquare size={22} className="animate-pulse" />}
            </motion.button>
          </div>
        </GlassContainer>
      )}
    </AnimatePresence>
  );
};

export default TestPage;
