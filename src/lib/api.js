const API_URL = 'http://localhost:8000';

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
export const register = async (name, email, password) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }
  const data = await response.json();
  setToken(data.access_token);
  return data.user;
};

/**
 * Auth API: Login
 */
export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email); // OAuth2 expects 'username'
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
  return data.user;
};

/**
 * Auth API: Get current user
 */
export const getMe = async () => {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(`${API_URL}/me`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    removeToken();
    return null;
  }
  return response.json();
};

/**
 * Fetches historical screening results for the current user.
 */
export const getHistory = async () => {
  try {
    const response = await fetch(`${API_URL}/history`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to fetch history');
    
    return await response.json();
  } catch (err) {
    console.error("API History Error:", err);
    return [];
  }
};

/**
 * Sends test results to the FastAPI backend for advanced analysis and DB persistence.
 */
export const analyzeResults = async (motor_ms, facial_ms, extraData = {}) => {
  try {
    const payload = { 
      motor_ms: parseFloat(motor_ms) || 450, 
      facial_ms: parseFloat(facial_ms) || 500,
      asymmetry_index: parseFloat(extraData.asymmetry) || 0.0,
      tremor_hz: parseFloat(extraData.tremor_hz) || 0.0,
      voice_jitter: parseFloat(extraData.acoustic) || 0.0,
      h_shift: parseFloat(extraData.h_shift) || 0.0,
      v_shift: parseFloat(extraData.v_shift) || 0.0,
      expansion: parseFloat(extraData.expansion) || 0.0
    };

    const response = await fetch(`${API_URL}/analyze_reaction`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Backend analysis failed');
    
    return await response.json();
  } catch (err) {
    console.error("API Analysis Error:", err);
    return null;
  }
};

/**
 * Core risk calculation logic (Sync)
 */
export const calculateRisks = (results) => {
  const motorRT = results.motor || 450;
  const facialRT = results.facial || 500;
  
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
