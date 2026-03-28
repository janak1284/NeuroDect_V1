-- NeuroDect Database Schema (PostgreSQL / Neon DB)

-- 1. Users Table
-- Stores the unique identifier for longitudinal tracking.
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Screening Results Table
-- Stores raw biomarkers and calculated disease risks.
CREATE TABLE IF NOT EXISTS screening_results (
    session_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Raw Biomarkers (Essential for XAI and historical tracking)
    asymmetry_index FLOAT,        -- From Smile Test
    tremor_frequency_hz FLOAT,    -- From Hand Stability (FFT)
    voice_jitter_pct FLOAT,       -- From Audio Analysis
    reaction_time_ms FLOAT,       -- From Neural Reflex Test

    -- Calculated Disease Risks (0.0% to 100.0%)
    stroke_risk_pct FLOAT,             
    parkinsons_risk_pct FLOAT,         
    essential_tremor_risk_pct FLOAT,   
    als_risk_pct FLOAT,                

    -- Aggregated Score
    overall_risk_score FLOAT           
);

-- Index for performance on historical/longitudinal queries
CREATE INDEX IF NOT EXISTS idx_user_results ON screening_results(user_id, created_at DESC);
