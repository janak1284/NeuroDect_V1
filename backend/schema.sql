-- NeuroDect Database Schema (PostgreSQL / Neon DB)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Provider',
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Screening Results Table
CREATE TABLE IF NOT EXISTS screening_results (
    session_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Raw Biomarkers
    asymmetry_index FLOAT DEFAULT 0.0,
    tremor_frequency_hz FLOAT DEFAULT 0.0,
    voice_jitter_pct FLOAT DEFAULT 0.0,
    reaction_time_ms FLOAT DEFAULT 0.0,
    facial_ms FLOAT DEFAULT 0.0,
    gesture_latency FLOAT DEFAULT 0.0,
    reflex_ms FLOAT DEFAULT 0.0,
    acoustic_ms FLOAT DEFAULT 0.0,
    
    -- Facial Shift Biomarkers (from smile_test.py)
    h_shift FLOAT DEFAULT 0.0,
    v_shift FLOAT DEFAULT 0.0,
    expansion FLOAT DEFAULT 0.0,
    
    -- Calculated Disease Risks (0.0% to 100.0%)
    stroke_risk_pct FLOAT DEFAULT 0.0,             
    parkinsons_risk_pct FLOAT DEFAULT 0.0,         
    essential_tremor_risk_pct FLOAT DEFAULT 0.0,   
    als_risk_pct FLOAT DEFAULT 0.0,
    bells_palsy_risk_pct FLOAT DEFAULT 0.0,
    
    -- Aggregated Score
    overall_risk_score FLOAT DEFAULT 0.0
);

-- Index for performance on historical/longitudinal queries
CREATE INDEX IF NOT EXISTS idx_user_results ON screening_results(user_id, created_at DESC);
