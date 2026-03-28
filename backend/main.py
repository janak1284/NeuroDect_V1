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
# DB INITIALIZATION
# =========================

async def init_db():
    print("Initializing self-healing database...")
    if not DATABASE_URL:
        print("DATABASE_URL not set, skipping DB init.")
        return
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # 1. Ensure tables exist with basic structure
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id UUID PRIMARY KEY,
                name TEXT NOT NULL DEFAULT 'Provider',
                email TEXT DEFAULT '',
                password_hash TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        ''')

        # Migration: Add missing columns if they don't exist
        cols = await conn.fetch("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
        col_names = [c['column_name'] for c in cols]
        
        if 'email' not in col_names:
            await conn.execute("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''")
        if 'password_hash' not in col_names:
            await conn.execute("ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''")
        if 'name' not in col_names:
            await conn.execute("ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT 'Provider'")

        # Safe UNIQUE constraint handling
        try:
            await conn.execute("ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email)")
        except:
            pass 

        # 2. Screening Results Table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS screening_results (
                session_id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                asymmetry_index FLOAT,        
                tremor_frequency_hz FLOAT,    
                voice_jitter_pct FLOAT,       
                reaction_time_ms FLOAT,       
                stroke_risk_pct FLOAT,             
                parkinsons_risk_pct FLOAT,         
                essential_tremor_risk_pct FLOAT,   
                als_risk_pct FLOAT,                
                overall_risk_score FLOAT           
            );
        ''')
        print("Database initialized successfully.")
        await conn.close()
    except Exception as e:
        print(f"Database initialization failed: {e}")

@app.on_event("startup")
async def startup_event():
    if DATABASE_URL and "postgres" in DATABASE_URL:
        await init_db()

# =========================
# AUTHENTICATION ENDPOINTS
# =========================

@app.post("/register")
async def register(user: UserRegister):
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    email_norm = user.email.strip().lower()
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        hashed_password = pwd_context.hash(user.password)
        
        # Self-healing logic: UPSERT (Update on conflict)
        # This allows users to "fix" their account if locked out by signing up again
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
        
        print(f"User synced/registered: {email_norm}")
        return {"user_id": str(result['user_id']), "name": result['name'], "email": result['email']}
    finally:
        await conn.close()

@app.post("/login")
async def login(user: UserLogin):
    email_norm = user.email.strip().lower()
    print(f"Login attempt for: {email_norm}")
    
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        db_user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email_norm)
        if not db_user:
            print(f"Login failed: Email {email_norm} not found")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        stored_hash = db_user['password_hash']
        
        if not stored_hash or stored_hash == '':
            print(f"Login failed: User {email_norm} has legacy empty password")
            raise HTTPException(status_code=401, detail="Account repair required. Please use 'Create Account' with this email.")

        if not pwd_context.verify(user.password, stored_hash):
            print(f"Login failed: Password mismatch for {email_norm}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        print(f"Login successful for user: {db_user['name']}")
        return {
            "user_id": str(db_user['user_id']),
            "name": db_user['name'],
            "email": db_user['email']
        }
    finally:
        await conn.close()

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

    if DATABASE_URL and "postgres" in DATABASE_URL and data.user_id:
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            overall = sum(r["risk_percentage"] for r in risks) / 4.0
            await conn.execute('''
                INSERT INTO screening_results (
                    user_id, asymmetry_index, tremor_frequency_hz, voice_jitter_pct, reaction_time_ms,
                    stroke_risk_pct, parkinsons_risk_pct, essential_tremor_risk_pct, als_risk_pct,
                    overall_risk_score
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ''', 
            uuid.UUID(data.user_id), asymmetry, tremor, jitter, motor,
            stroke_score * 100, parkinson_score * 100, et_score * 100, als_score * 100,
            overall)
            await conn.close()
        except Exception as e:
            print(f"Database insertion error: {e}")

    return risks

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
