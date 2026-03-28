import os
import math
import uuid
import asyncio
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
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
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-dev-only-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# =========================
# DATA MODELS
# =========================

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

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
        # 1. Users Table (Updated for Auth)
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id UUID PRIMARY KEY,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        # Ensure email and hashed_password columns exist (for existing tables)
        await conn.execute('''
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
            ADD COLUMN IF NOT EXISTS hashed_password TEXT;
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
# AUTH UTILITIES
# =========================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user_id(token: str = Depends(oauth2_scheme)):
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
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    return token_data.user_id

# =========================
# AUTH ENDPOINTS
# =========================

@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Check if user exists
        existing_user = await conn.fetchrow("SELECT user_id FROM users WHERE email = $1", user.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_id = uuid.uuid4()
        hashed_pw = get_password_hash(user.password)
        
        await conn.execute(
            "INSERT INTO users (user_id, email, hashed_password) VALUES ($1, $2, $3)",
            user_id, user.email, hashed_pw
        )
        return {"message": "User created successfully", "user_id": str(user_id)}
    finally:
        await conn.close()

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", form_data.username)
        if not user or not verify_password(form_data.password, user['hashed_password']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user['user_id'])}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        await conn.close()

@app.get("/me")
async def read_users_me(current_user_id: str = Depends(get_current_user_id)):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        user = await conn.fetchrow("SELECT user_id, email, created_at FROM users WHERE user_id = $1", uuid.UUID(current_user_id))
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return dict(user)
    finally:
        await conn.close()

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
    MOTOR_BASELINE = 450  
    FACIAL_BASELINE = 500
    MOTOR_STD = 150 
    FACIAL_STD = 180

    # Normalize inputs
    motor_z = normalize(motor, MOTOR_BASELINE, MOTOR_STD)
    facial_z = normalize(facial, FACIAL_BASELINE, FACIAL_STD)

    # =========================
    # DISEASE-SPECIFIC MODELS
    # =========================
    parkinson_score = sigmoid(1.2 * motor_z + 2.0 * (1.0 if 4 <= tremor <= 6 else 0.2) - 2.5)
    stroke_score = sigmoid(1.0 * motor_z + 1.5 * facial_z + 3.0 * asymmetry - 2.8)
    et_score = sigmoid(2.5 * (1.0 if 4 <= tremor <= 10 else 0.1) - 2.2)
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
            u_id = data.user_id
            if not u_id:
                u_id = str(uuid.uuid4())
                try:
                    # Anonymous or new user record
                    await conn.execute('''
                        INSERT INTO users (user_id, last_active) 
                        VALUES ($1, CURRENT_TIMESTAMP)
                        ON CONFLICT (user_id) DO UPDATE SET last_active = EXCLUDED.last_active
                    ''', uuid.UUID(u_id))
                except Exception as e:
                    print(f"User sync error: {e}")
            else:
                # Update last active for existing user
                await conn.execute('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE user_id = $1', uuid.UUID(u_id))

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
