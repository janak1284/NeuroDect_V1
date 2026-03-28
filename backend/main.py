import os
import math
import uuid
import asyncio
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import asyncpg

load_dotenv()

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")

# =========================
# DATA MODELS
# =========================

class ReactionData(BaseModel):
    user_id: Optional[str] = None
    motor_ms: float
    facial_ms: float
    asymmetry_index: float = 0.0
    tremor_hz: float = 0.0
    voice_jitter: float = 0.0

class RiskResult(BaseModel):
    disease: str
    risk_percentage: float
    dependence_level: str
    insight: str

# =========================
# DB INITIALIZATION
# =========================

async def init_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # 1. Users Table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id UUID PRIMARY KEY,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        ''')

        # 2. Screening Results Table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS screening_results (
                session_id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                -- Raw Biomarkers
                asymmetry_index FLOAT,        
                tremor_frequency_hz FLOAT,    
                voice_jitter_pct FLOAT,       
                reaction_time_ms FLOAT,       

                -- Calculated Disease Risks
                stroke_risk_pct FLOAT,             
                parkinsons_risk_pct FLOAT,         
                essential_tremor_risk_pct FLOAT,   
                als_risk_pct FLOAT,                

                -- Aggregated Score
                overall_risk_score FLOAT           
            );
            CREATE INDEX IF NOT EXISTS idx_user_results ON screening_results(user_id, created_at DESC);
        ''')
    finally:
        await conn.close()

@app.on_event("startup")
async def startup_event():
    if DATABASE_URL and "postgres" in DATABASE_URL:
        await init_db()

# =========================
# CORE UTILITIES
# =========================

def sigmoid(x: float) -> float:
    """Logistic function for probability"""
    return 1 / (1 + math.exp(-x))

def normalize(value: float, mean: float, std: float) -> float:
    """Z-score normalization"""
    return (value - mean) / std

# =========================
# MAIN ANALYSIS ENDPOINT
# =========================

@app.post("/analyze_reaction", response_model=List[RiskResult])
async def analyze_reaction(data: ReactionData):

    motor = data.motor_ms
    facial = data.facial_ms
    asymmetry = data.asymmetry_index
    tremor = data.tremor_hz
    jitter = data.voice_jitter

    # =========================
    # BASELINE CALIBRATION (Home-Use Realistic)
    # =========================
    # Adjusted to ensure 450-550ms is within Nominal risk (<25%)
    MOTOR_BASELINE = 450  
    FACIAL_BASELINE = 500

    MOTOR_STD = 150 # Increased std to flatten the curve
    FACIAL_STD = 180

    # Normalize inputs
    motor_z = normalize(motor, MOTOR_BASELINE, MOTOR_STD)
    facial_z = normalize(facial, FACIAL_BASELINE, FACIAL_STD)

    # =========================
    # DISEASE-SPECIFIC MODELS (ALS Pivot)
    # =========================
    # Sigmoid shifted left with more negative bias to keep "Normal" latencies low.
    
    # Parkinson's: Peak 4-6Hz Tremor + Motor Delay
    parkinson_score = sigmoid(1.2 * motor_z + 2.0 * (1.0 if 4 <= tremor <= 6 else 0.2) - 2.5)
    
    # Acute Stroke: High Asymmetry + Facial/Motor Delay
    stroke_score = sigmoid(1.0 * motor_z + 1.5 * facial_z + 3.0 * asymmetry - 2.8)
    
    # Essential Tremor: Broad 4-10Hz Tremor
    et_score = sigmoid(2.5 * (1.0 if 4 <= tremor <= 10 else 0.1) - 2.2)
    
    # ALS: Motor Execution + Voice Jitter/Bulbar Proxy
    # Even if they see the signal, the motor execution is delayed.
    als_score = sigmoid(1.4 * motor_z + 2.5 * jitter - 2.6)

    # Aggregated results for frontend
    risks = [
        {
            "disease": "Parkinson's Disease",
            "risk_percentage": round(parkinson_score * 100, 1),
            "dependence_level": "High",
            "insight": f"Motor patterns (z={motor_z:.2f}) + tremor analysis ({tremor}Hz)"
        },
        {
            "disease": "Acute Stroke",
            "risk_percentage": round(stroke_score * 100, 1),
            "dependence_level": "High",
            "insight": f"Facial symmetry ({asymmetry:.2f}) + motor latency (z={motor_z:.2f})"
        },
        {
            "disease": "Essential Tremor",
            "risk_percentage": round(et_score * 100, 1),
            "dependence_level": "Moderate",
            "insight": f"Frequency analysis peaking at {tremor}Hz"
        },
        {
            "disease": "ALS",
            "risk_percentage": round(als_score * 100, 1),
            "dependence_level": "Moderate",
            "insight": f"Neuromotor delay (z={motor_z:.2f}) + speech jitter proxy ({jitter:.2f})"
        }
    ]

    # =========================
    # PERSIST TO DATABASE
    # =========================
    if DATABASE_URL and "postgres" in DATABASE_URL:
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            
            # Handle user creation/lookup
            u_id = data.user_id if data.user_id else str(uuid.uuid4())
            try:
                # Ensure user exists
                await conn.execute('''
                    INSERT INTO users (user_id, last_active) 
                    VALUES ($1, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id) DO UPDATE SET last_active = EXCLUDED.last_active
                ''', uuid.UUID(u_id))
            except Exception as e:
                print(f"User sync error: {e}")

            # Calculate overall score
            overall = sum(r["risk_percentage"] for r in risks) / 4.0

            # Insert results
            await conn.execute('''
                INSERT INTO screening_results (
                    user_id, asymmetry_index, tremor_frequency_hz, voice_jitter_pct, reaction_time_ms,
                    stroke_risk_pct, parkinsons_risk_pct, essential_tremor_risk_pct, als_risk_pct,
                    overall_risk_score
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ''', 
            uuid.UUID(u_id), asymmetry, tremor, jitter, motor,
            stroke_score * 100, parkinson_score * 100, et_score * 100, als_score * 100,
            overall)
            
            await conn.close()
        except Exception as e:
            print(f"Database insertion error: {e}")

    return risks


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)