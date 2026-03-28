/**
 * Core risk calculation logic.
 * Synchronized with backend thresholds for consistent home-use diagnostics.
 */
export const calculateRisks = (results) => {
  // Clinical Baselines adjusted for Home-Use / Webcam Latency
  const motorRT = results.motor || 450;
  const facialRT = results.facial || 500;
  
  // Weights matching backend logic for initial dashboard feedback
  const parkinsons = Math.min(95, Math.max(5, ((motorRT - 450) / 15) * 1.2 + 10));
  const stroke = Math.min(95, Math.max(5, ((facialRT - 500) / 15) * 1.5 + 8));
  const essentialTremor = Math.min(95, Math.max(5, 12)); 
  const als = Math.min(95, Math.max(5, ((motorRT - 450) / 15) * 1.4 + 12));

  return [
    { label: "Parkinson's", value: Math.round(parkinsons), color: parkinsons > 70 ? "text-rose-400" : parkinsons > 40 ? "text-amber-400" : "text-emerald-400" },
    { label: "Acute Stroke", value: Math.round(stroke), color: stroke > 70 ? "text-rose-400" : stroke > 40 ? "text-amber-400" : "text-emerald-400" },
    { label: "Essential Tremor", value: Math.round(essentialTremor), color: essentialTremor > 70 ? "text-rose-400" : essentialTremor > 40 ? "text-amber-400" : "text-emerald-400" },
    { label: "ALS", value: Math.round(als), color: als > 70 ? "text-rose-400" : als > 40 ? "text-amber-400" : "text-emerald-400" },
  ];
};

/**
 * Sends test results to the FastAPI backend for advanced analysis and DB persistence.
 */
export const analyzeResults = async (motor_ms, facial_ms, user_id = null, extraData = {}) => {
  try {
    const payload = { 
      user_id, 
      motor_ms: parseFloat(motor_ms) || 450, 
      facial_ms: parseFloat(facial_ms) || 500,
      asymmetry_index: parseFloat(extraData.asymmetry) || 0.0,
      tremor_hz: parseFloat(extraData.tremor_hz) || 0.0,
      voice_jitter: parseFloat(extraData.acoustic) || 0.0
    };

    const response = await fetch('http://localhost:8000/analyze_reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Backend analysis failed');
    
    return await response.json();
  } catch (err) {
    console.error("API Analysis Error:", err);
    return null;
  }
};
