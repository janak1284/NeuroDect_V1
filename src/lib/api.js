const API_URL = 'http://localhost:8000';

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
 * Auth Helper: Get stored token
 */
export const getToken = () => localStorage.getItem('neurodect_token');

/**
 * Auth Helper: Set stored token
 */
export const setToken = (token) => localStorage.setItem('neurodect_token', token);

/**
 * Auth Helper: Remove stored token
 */
export const removeToken = () => localStorage.removeItem('neurodect_token');

/**
 * Auth Helper: Get Headers with Auth
 */
const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Auth API: Register
 */
export const register = async (email, password) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }
  return response.json();
};

/**
 * Auth API: Login
 */
export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }
  const data = await response.json();
  setToken(data.access_token);
  return data;
};

/**
 * Auth API: Get current user
 */
export const getMe = async () => {
  const response = await fetch(`${API_URL}/me`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    removeToken();
    throw new Error('Session expired');
  }
  return response.json();
};

/**
 * Sends test results to the FastAPI backend for advanced analysis and DB persistence.
 */
export const analyzeResults = async (motor_ms, facial_ms, user_id = null) => {
  try {
    const response = await fetch(`${API_URL}/analyze_reaction`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        user_id, 
        motor_ms, 
        facial_ms,
        asymmetry_index: 0.0, 
        tremor_hz: 0.0,        
        voice_jitter: 0.0      
      }),
    });
    return await response.json();
  } catch (err) {
    console.error("API Analysis Error:", err);
    return null;
  }
};
