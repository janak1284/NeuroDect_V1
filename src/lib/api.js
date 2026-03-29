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
export const getHeaders = (isMultipart = false) => {
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
  const formData = new URLSearchParams();
  formData.append('username', email); // OAuth2 expects 'username'
  formData.append('password', password);

  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

  try {
    const response = await fetch(`${API_URL}/me`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      removeToken();
      return null;
    }
    return response.json();
  } catch (e) {
    return null;
  }
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
 * Fetches the clinical consensus and unified results across all 4 tables.
 */
export const aggregateResults = async () => {
  try {
    const response = await fetch(`${API_URL}/aggregate_results`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) throw new Error('Failed to aggregate results');
    
    return await response.json();
  } catch (err) {
    console.error("API Aggregation Error:", err);
    return null;
  }
};

/**
 * Sends test results to the FastAPI backend for advanced analysis and DB persistence.
 * Now routes specifically to the individual test tables.
 */
export const analyzeResults = async (motor_ms, facial_ms, extraData = {}) => {
  try {
    const results = [];
    
    // 1. Send Neural Reflex data
    const reflexRes = await fetch(`${API_URL}/process_biometrics`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        test_type: 'reflex',
        raw_data: { motorRT: motor_ms, facial: facial_ms }
      }),
    });
    results.push(await reflexRes.json());

    // 2. Send Audio data if present
    if (extraData.acoustic) {
      const audioRes = await fetch(`${API_URL}/process_biometrics`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          test_type: 'audio',
          raw_data: { acoustic: extraData.acoustic, jitter: extraData.jitter || 0.01 }
        }),
      });
      results.push(await audioRes.json());
    }

    // Hand and Smile are already sent immediately during their own protocol finalizing in TestModules.jsx
    
    return results;
  } catch (err) {
    console.error("API Persistence Error:", err);
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
  const bellsPalsy = Math.min(95, Math.max(5, 12)); 
  const als = Math.min(95, Math.max(5, ((motorRT - 450) / 15) * 1.4 + 12));

  return [
    { label: "Parkinson's", value: Math.round(parkinsons), key: "parkinsons_risk", color: parkinsons > 70 ? "text-rose-400" : parkinsons > 40 ? "text-amber-400" : "text-emerald-400" },
    { label: "Acute Stroke", value: Math.round(stroke), key: "stroke_risk", color: stroke > 70 ? "text-rose-400" : stroke > 40 ? "text-amber-400" : "text-emerald-400" },
    { label: "Bell's Palsy", value: Math.round(bellsPalsy), key: "bells_palsy_risk", color: bellsPalsy > 70 ? "text-rose-400" : bellsPalsy > 40 ? "text-amber-400" : "text-emerald-400" },
    { label: "ALS", value: Math.round(als), key: "als_risk", color: als > 70 ? "text-rose-400" : als > 40 ? "text-amber-400" : "text-emerald-400" },
  ];
};
