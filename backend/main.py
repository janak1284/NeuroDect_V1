import os
import math
import uuid
import asyncio
import asyncpg
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

load_dotenv()

app = FastAPI()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-for-development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Enable CORS
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

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ReactionData(BaseModel):
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
# AUTH UTILITIES
# =========================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db_pool = await get_pool()
    async with db_pool.acquire() as conn:
        user = await conn.fetchrow("SELECT user_id, name, email FROM users WHERE user_id = $1", uuid.UUID(user_id))
        if user is None:
            raise credentials_exception
        user_dict = dict(user)
        # Convert UUID to string for consistent handling
        user_dict['user_id'] = str(user_dict['user_id'])
        return user_dict

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
            # Check if email exists
            existing = await conn.fetchrow("SELECT user_id FROM users WHERE email = $1", email_norm)
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")

            u_id = uuid.uuid4()
            await conn.execute(
                "INSERT INTO users (user_id, name, email, password_hash) VALUES ($1, $2, $3, $4)",
                u_id, user.name.strip(), email_norm, hashed_password
            )
            
            access_token = create_access_token(data={"sub": str(u_id)})
            return {
                "access_token": access_token, 
                "token_type": "bearer",
                "user": {"user_id": str(u_id), "name": user.name.strip(), "email": email_norm}
            }
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=400, detail=str(e))

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    email_norm = form_data.username.strip().lower()
    db_pool = await get_pool()
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    async with db_pool.acquire() as conn:
        db_user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email_norm)
        if not db_user or not pwd_context.verify(form_data.password, db_user['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"sub": str(db_user['user_id'])})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "user_id": str(db_user['user_id']),
                "name": db_user['name'],
                "email": db_user['email']
            }
        }

@app.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# =========================
# HISTORY ENDPOINT
# =========================

@app.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    db_pool = await get_pool()
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM screening_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            uuid.UUID(current_user['user_id'])
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

@app.post("/analyze_reaction")
async def analyze_reaction(data: ReactionData, current_user: dict = Depends(get_current_user)):
    motor = data.motor_ms
    facial = data.facial_ms
    asymmetry = data.asymmetry_index
    tremor = data.tremor_hz
    jitter = data.voice_jitter
    h_shift = data.h_shift
    v_shift = data.v_shift
    expansion = data.expansion

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
    bells_palsy_score = sigmoid(2.5 * asymmetry + 1.5 * (h_shift + v_shift) - 2.0)

    risks = [
        {"disease": "Parkinson's Disease", "risk_percentage": round(parkinson_score * 100, 1), "dependence_level": "High", "insight": f"Motor patterns (z={motor_z:.2f}) + tremor analysis ({tremor}Hz)"},
        {"disease": "Acute Stroke", "risk_percentage": round(stroke_score * 100, 1), "dependence_level": "High", "insight": f"Facial symmetry ({asymmetry:.2f}) + motor latency (z={motor_z:.2f})"},
        {"disease": "Essential Tremor", "risk_percentage": round(et_score * 100, 1), "dependence_level": "Moderate", "insight": f"Frequency analysis peaking at {tremor}Hz"},
        {"disease": "ALS", "risk_percentage": round(als_score * 100, 1), "dependence_level": "Moderate", "insight": f"Neuromotor delay (z={motor_z:.2f}) + speech jitter proxy ({jitter:.2f})"},
        {"disease": "Bell's Palsy", "risk_percentage": round(bells_palsy_score * 100, 1), "dependence_level": "High", "insight": f"Micro-asymmetries ({asymmetry:.2f}) + muscular shifts"}
    ]

    db_pool = await get_pool()
    result_record = {"risks": risks}
    
    if db_pool:
        try:
            overall = sum(r["risk_percentage"] for r in risks) / 5.0
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow('''
                    INSERT INTO screening_results (
                        user_id, asymmetry_index, tremor_frequency_hz, voice_jitter_pct, reaction_time_ms,
                        facial_ms, gesture_latency,
                        stroke_risk_pct, parkinsons_risk_pct, essential_tremor_risk_pct, als_risk_pct,
                        overall_risk_score, h_shift, v_shift, expansion, bells_palsy_risk_pct
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    RETURNING *
                ''', 
                uuid.UUID(current_user['user_id']), asymmetry, tremor, jitter, motor,
                facial, facial,
                stroke_score * 100, parkinson_score * 100, et_score * 100, als_score * 100,
                overall, h_shift, v_shift, expansion, bells_palsy_score * 100)
                
                if row:
                    result_record = dict(row)
                    result_record["risks"] = risks # Keep the detailed risks format
        except Exception as e:
            print(f"Database insertion error: {e}")

    return result_record

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
