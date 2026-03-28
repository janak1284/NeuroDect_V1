import os
import math
import uuid
import asyncio
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import asyncpg
from passlib.context import CryptContext

load_dotenv()

app = FastAPI()

# Password hashing setup - forcing bcrypt for reliability
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

from pydantic import BaseModel, Field

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str = Field(..., alias="username") # Accept both email and username
    password: str

    class Config:
        populate_by_name = True # Allow using 'email' in the code even if 'username' is passed

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
# DATABASE CONNECTION POOL
# =========================

pool = None

async def get_pool():
    global pool
    if pool is None:
        if not DATABASE_URL:
            print("DATABASE_URL not set!")
            return None
        pool = await asyncpg.create_pool(DATABASE_URL)
    return pool

# =========================
# DB INITIALIZATION
# =========================

async def init_db():
    print("Initializing self-healing database...")
    db_pool = await get_pool()
    if not db_pool:
        return
    
    async with db_pool.acquire() as conn:
        # 1. Users Table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id UUID PRIMARY KEY,
                name TEXT NOT NULL DEFAULT 'Provider',
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        ''')

        # 2. Screening Results Table (Comprehensive Schema)
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS screening_results (
                session_id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                -- Raw Biomarkers
                asymmetry_index FLOAT DEFAULT 0.0,
                tremor_frequency_hz FLOAT DEFAULT 0.0,
                voice_jitter_pct FLOAT DEFAULT 0.0,
                reaction_time_ms FLOAT DEFAULT 0.0, -- Motor RT
                facial_ms FLOAT DEFAULT 0.0,        -- Gesture RT
                gesture_latency FLOAT DEFAULT 0.0,   -- Specific latency column
                reflex_ms FLOAT DEFAULT 0.0,        -- Neural Reflex
                acoustic_ms FLOAT DEFAULT 0.0,      -- Acoustic cadence
                
                -- Calculated Disease Risks
                stroke_risk_pct FLOAT,             
                parkinsons_risk_pct FLOAT,         
                essential_tremor_risk_pct FLOAT,   
                als_risk_pct FLOAT,                
                
                -- Summary
                overall_risk_score FLOAT           
            );
        ''')

        # Migration: Ensure all columns exist
        tables_to_check = {
            'screening_results': [
                ('facial_ms', 'FLOAT'),
                ('gesture_latency', 'FLOAT'),
                ('reflex_ms', 'FLOAT'),
                ('acoustic_ms', 'FLOAT')
            ]
        }
        
        for table, columns in tables_to_check.items():
            existing_cols = await conn.fetch(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'")
            existing_names = [c['column_name'] for c in existing_cols]
            for col_name, col_type in columns:
                if col_name not in existing_names:
                    print(f"Migrating: Adding {col_name} to {table}")
                    await conn.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type} DEFAULT 0.0")

        print("Database initialized successfully.")

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.on_event("shutdown")
async def shutdown_event():
    if pool:
        await pool.close()

# =========================
# AUTHENTICATION ENDPOINTS
# =========================

@app.post("/register")
async def register(user: UserRegister):
    db_pool = await get_pool()
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    email_norm = user.email.strip().lower()
    async with db_pool.acquire() as conn:
        hashed_password = pwd_context.hash(user.password)
        try:
            result = await conn.fetchrow(
                """
                INSERT INTO users (user_id, name, email, password_hash) 
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (email) DO UPDATE SET 
                    password_hash = EXCLUDED.password_hash,
                    name = EXCLUDED.name,
                    last_active = CURRENT_TIMESTAMP
                RETURNING user_id, name, email
                """,
                uuid.uuid4(), user.name.strip(), email_norm, hashed_password
            )
            return {"user_id": str(result['user_id']), "name": result['name'], "email": result['email']}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
async def login(user: UserLogin):
    email_norm = user.email.strip().lower()
    db_pool = await get_pool()
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    async with db_pool.acquire() as conn:
        db_user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email_norm)
        if not db_user or not pwd_context.verify(user.password, db_user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        return {
            "user_id": str(db_user['user_id']),
            "name": db_user['name'],
            "email": db_user['email']
        }

# =========================
# HISTORY ENDPOINT
# =========================

@app.get("/history/{user_id}")
async def get_history(user_id: str):
    db_pool = await get_pool()
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM screening_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            uuid.UUID(user_id)
        )
        return [dict(r) for r in rows]

# =========================
# CORE UTILITIES
# =========================

def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))

def normalize(value: float, mean: float, std: float) -> float:
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

    MOTOR_BASELINE = 450  
    FACIAL_BASELINE = 500
    MOTOR_STD = 150 
    FACIAL_STD = 180

    motor_z = normalize(motor, MOTOR_BASELINE, MOTOR_STD)
    facial_z = normalize(facial, FACIAL_BASELINE, FACIAL_STD)

    parkinson_score = sigmoid(1.2 * motor_z + 2.0 * (1.0 if 4 <= tremor <= 6 else 0.2) - 2.5)
    stroke_score = sigmoid(1.0 * motor_z + 1.5 * facial_z + 3.0 * asymmetry - 2.8)
    et_score = sigmoid(2.5 * (1.0 if 4 <= tremor <= 10 else 0.1) - 2.2)
    als_score = sigmoid(1.4 * motor_z + 2.5 * jitter - 2.6)

    risks = [
        {"disease": "Parkinson's Disease", "risk_percentage": round(parkinson_score * 100, 1), "dependence_level": "High", "insight": f"Motor patterns (z={motor_z:.2f}) + tremor analysis ({tremor}Hz)"},
        {"disease": "Acute Stroke", "risk_percentage": round(stroke_score * 100, 1), "dependence_level": "High", "insight": f"Facial symmetry ({asymmetry:.2f}) + motor latency (z={motor_z:.2f})"},
        {"disease": "Essential Tremor", "risk_percentage": round(et_score * 100, 1), "dependence_level": "Moderate", "insight": f"Frequency analysis peaking at {tremor}Hz"},
        {"disease": "ALS", "risk_percentage": round(als_score * 100, 1), "dependence_level": "Moderate", "insight": f"Neuromotor delay (z={motor_z:.2f}) + speech jitter proxy ({jitter:.2f})"}
    ]

    db_pool = await get_pool()
    if db_pool and data.user_id:
        try:
            overall = sum(r["risk_percentage"] for r in risks) / 4.0
            async with db_pool.acquire() as conn:
                await conn.execute('''
                    INSERT INTO screening_results (
                        user_id, asymmetry_index, tremor_frequency_hz, voice_jitter_pct, reaction_time_ms,
                        facial_ms, gesture_latency,
                        stroke_risk_pct, parkinsons_risk_pct, essential_tremor_risk_pct, als_risk_pct,
                        overall_risk_score
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ''', 
                uuid.UUID(data.user_id), asymmetry, tremor, jitter, motor,
                facial, facial, # gesture_latency uses facial_ms value
                stroke_score * 100, parkinson_score * 100, et_score * 100, als_score * 100,
                overall)
        except Exception as e:
            print(f"Database insertion error: {e}")

    return risks

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
