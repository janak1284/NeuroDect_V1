import os
import math
import uuid
import asyncio
import asyncpg
import numpy as np
from typing import List, Optional, Union
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, Field, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

load_dotenv()

app = FastAPI()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-for-development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

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

class BiometricData(BaseModel):
    test_type: str 
    raw_data: dict

# =========================
# DATABASE
# =========================

pool = None

async def get_pool():
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(DATABASE_URL)
    return pool

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        db_pool = await get_pool()
        async with db_pool.acquire() as conn:
            user = await conn.fetchrow("SELECT user_id, name, email FROM users WHERE user_id = $1", uuid.UUID(user_id))
            user_dict = dict(user)
            user_dict['user_id'] = str(user_dict['user_id'])
            return user_dict
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

# =========================
# CORE BIOMETRIC LOGIC
# =========================

def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))

def calculate_smile_risks(neutral: dict, peak: dict):
    """
    Implements core logic from smile_test.py
    Calculates 4 risks based on facial biometric deltas.
    """
    h_shift = max(0, peak['h_asym'] - neutral['h_asym'])
    v_shift = max(0, peak['v_asym'] - neutral['v_asym'])
    expansion = max(0, peak['intensity'] - neutral['intensity'])
    
    # 1. Stroke Risk (Dynamic Horizontal & Vertical Shift)
    h_risk = np.interp(h_shift, [0.015, 0.08], [0, 100])
    v_risk = np.interp(v_shift, [0.015, 0.08], [0, 100])
    stroke_risk = (h_risk * 0.4) + (v_risk * 0.6)

    # 2. Parkinson's Risk (Hypomimia - lack of expansion/intensity delta)
    parkinson_risk = np.interp(expansion, [0.03, 0.10], [100, 0])

    # 3. ALS Risk (Mix of hypomimia and asymmetry)
    als_risk = (parkinson_risk * 0.6) + (stroke_risk * 0.4)

    # 4. Bell's Palsy Risk (High weight on vertical droop)
    bells_palsy_risk = (v_risk * 0.7) + (h_risk * 0.3)

    return {
        "stroke_risk": round(min(98, max(5, stroke_risk)), 2),
        "parkinsons_risk": round(min(98, max(5, parkinson_risk)), 2),
        "als_risk": round(min(98, max(5, als_risk)), 2),
        "bells_palsy_risk": round(min(98, max(5, bells_palsy_risk)), 2),
        "asymmetry_index": round((neutral['h_asym'] + neutral['v_asym']) / 2, 4),
        "h_shift": round(h_shift, 4),
        "v_shift": round(v_shift, 4),
        "expansion": round(expansion, 4)
    }

def analyze_hand_motion(data: List[List[float]]):
    if len(data) < 15: return {"tremor_hz": 0, "parkinsons_risk": 5, "stroke_risk": 5}
    data_np = np.array(data)
    times, x_vals, y_vals = data_np[:, 0], data_np[:, 1] * 640, data_np[:, 2] * 480
    
    y_drift = np.mean(y_vals[-10:]) - np.mean(y_vals[:10])
    stroke_score = min(max(int((y_drift / 40.0) * 100), 0), 98) 

    p_x = np.polyfit(times, x_vals, 1)
    x_detrended = x_vals - (p_x[0]*times + p_x[1])
    shake_amplitude = np.std(x_detrended)
    base_shake_score = np.interp(shake_amplitude, [1.0, 8.0], [0, 100])

    dx = np.diff(x_vals)
    x_turns = np.sum(np.diff(np.sign(dx[np.abs(dx) > 0.5])) != 0) if len(dx) > 1 else 0
    freq = (x_turns / 2.0) / (times[-1] - times[0] + 1e-6)

    p_risk = base_shake_score if (3.0 <= freq <= 8.0) else 5
    return {"tremor_hz": round(freq, 1), "parkinsons_risk": round(p_risk, 2), "stroke_risk": round(stroke_score, 2)}

# =========================
# AUTH UTILS
# =========================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# =========================
# ENDPOINTS
# =========================

@app.get("/me")
async def get_me_endpoint(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/process_biometrics")
async def process_biometrics(data: BiometricData, current_user: dict = Depends(get_current_user)):
    print(f"DEBUG: Received biometrics for test: {data.test_type}")
    db_pool = await get_pool()
    u_id = uuid.UUID(current_user['user_id'])
    test = data.test_type
    raw = data.raw_data
    
    results = {}
    try:
        async with db_pool.acquire() as conn:
            if test == 'smile':
                results = calculate_smile_risks(raw['neutral'], raw['peak'])
                await conn.execute('''
                    INSERT INTO facemesh_results (user_id, asymmetry_index, h_shift, v_shift, expansion, stroke_risk, bells_palsy_risk, als_risk, parkinsons_risk)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ''', u_id, results['asymmetry_index'], results['h_shift'], results['v_shift'], results['expansion'], 
                results['stroke_risk'], results['bells_palsy_risk'], results['als_risk'], results['parkinsons_risk'])
                print("DEBUG: Saved smile results to database")
            
            elif test == 'hand':
                motion_results = analyze_hand_motion(raw['motion_data'])
                # For hand, we fill in other risks as baseline or derived
                results = {
                    "tremor_hz": motion_results['tremor_hz'],
                    "parkinsons_risk": motion_results['parkinsons_risk'],
                    "stroke_risk": motion_results['stroke_risk'],
                    "als_risk": min(98, max(5, motion_results['parkinsons_risk'] * 0.5)),
                    "bells_palsy_risk": 5.0
                }
                await conn.execute('''
                    INSERT INTO motor_results (user_id, tremor_frequency_hz, stroke_risk, bells_palsy_risk, als_risk, parkinsons_risk)
                    VALUES ($1, $2, $3, $4, $5, $6)
                ''', u_id, results['tremor_hz'], results['stroke_risk'], results['bells_palsy_risk'], results['als_risk'], results['parkinsons_risk'])
                print("DEBUG: Saved hand results to database")

            elif test == 'audio':
                jitter = raw.get('acoustic_jitter', 0.02)
                shimmer = raw.get('acoustic_shimmer', 0.02)
                pauses = raw.get('pause_ratio', 0.1)
                
                # Clinical Algorithm Mapping
                # 1. ALS (Bulbar): High Jitter and Shimmer (spastic dysarthria)
                als_risk = np.interp(jitter + shimmer, [0.03, 0.12], [5, 95])
                
                # 2. Parkinson's: Hypophonia (monotone, high pauses) + mild jitter
                p_risk = np.interp(pauses + (shimmer * 0.5), [0.1, 0.45], [5, 95])
                
                # 3. Stroke: Aphasia/Dysarthria -> extremely high pauses, moderate shimmer
                s_risk = np.interp(pauses, [0.15, 0.5], [5, 95])
                
                # 4. Bell's Palsy: Mild articulatory defect, mostly normal vocal folds
                b_risk = np.interp(pauses, [0.2, 0.6], [5, 30])

                results = {
                    "als_risk": round(min(98, max(5, als_risk)), 2),
                    "parkinsons_risk": round(min(98, max(5, p_risk)), 2),
                    "stroke_risk": round(min(98, max(5, s_risk)), 2),
                    "bells_palsy_risk": round(min(98, max(5, b_risk)), 2),
                    "voice_jitter_pct": jitter,
                    "acoustic_ms": shimmer
                }
                await conn.execute('''
                    INSERT INTO audio_results (user_id, voice_jitter_pct, acoustic_ms, stroke_risk, bells_palsy_risk, als_risk, parkinsons_risk)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                ''', u_id, results['voice_jitter_pct'], results['acoustic_ms'], results['stroke_risk'], results['bells_palsy_risk'], results['als_risk'], results['parkinsons_risk'])
                print("DEBUG: Saved audio results to database")

            elif test == 'reflex':
                motor_rt = raw.get('motorRT', 250)
                facial_rt = raw.get('facial', 300)
                # Reaction time slowing is a marker for Parkinson's and Stroke
                p_risk = raw.get('parkinsons_risk', np.interp(motor_rt, [200, 500], [5, 95]))
                s_risk = raw.get('stroke_risk', np.interp(facial_rt, [250, 600], [5, 95]))
                a_risk = raw.get('als_risk', (p_risk + s_risk) / 2)
                b_risk = raw.get('bells_palsy_risk', 5.0)
                
                results = {
                    "parkinsons_risk": round(p_risk, 2),
                    "stroke_risk": round(s_risk, 2),
                    "als_risk": round(a_risk, 2),
                    "bells_palsy_risk": round(b_risk, 2),
                    "motor_ms": motor_rt,
                    "facial_ms": facial_rt,
                    "reflex_ms": (motor_rt + facial_rt) / 2
                }
                await conn.execute('''
                    INSERT INTO reflex_results (user_id, motor_ms, facial_ms, reflex_ms, stroke_risk, bells_palsy_risk, als_risk, parkinsons_risk)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ''', u_id, results['motor_ms'], results['facial_ms'], results['reflex_ms'], results['stroke_risk'], results['bells_palsy_risk'], results['als_risk'], results['parkinsons_risk'])
                print("DEBUG: Saved reflex results to database")

        return results
    except Exception as e:
        print(f"ERROR: Database insertion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/aggregate_results")
async def get_aggregated_results(current_user: dict = Depends(get_current_user)):
    db_pool = await get_pool()
    u_id = uuid.UUID(current_user['user_id'])
    async with db_pool.acquire() as conn:
        f = await conn.fetchrow("SELECT * FROM facemesh_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", u_id)
        a = await conn.fetchrow("SELECT * FROM audio_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", u_id)
        m = await conn.fetchrow("SELECT * FROM motor_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", u_id)
        r = await conn.fetchrow("SELECT * FROM reflex_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", u_id)

        def fusion(key):
            # Weighted Clinical Fusion
            if key == 'stroke_risk': return (f[key] if f else 5)*0.6 + (m[key] if m else 5)*0.2 + (r[key] if r else 5)*0.2
            if key == 'parkinsons_risk': return (m[key] if m else 5)*0.5 + (f[key] if f else 5)*0.3 + (r[key] if r else 5)*0.2
            if key == 'als_risk': return (a[key] if a else 5)*0.6 + (r[key] if r else 5)*0.2 + (m[key] if m else 5)*0.2
            if key == 'bells_palsy_risk': return (f[key] if f else 5)*0.9 + (r[key] if r else 5)*0.1
            return 5

        consensus = [
            {"disease": "Acute Stroke", "score": round(fusion('stroke_risk'), 1)},
            {"disease": "Parkinson's Disease", "score": round(fusion('parkinsons_risk'), 1)},
            {"disease": "ALS (Bulbar)", "score": round(fusion('als_risk'), 1)},
            {"disease": "Bell's Palsy", "score": round(fusion('bells_palsy_risk'), 1)}
        ]
        return {"test_results": {"facial": dict(f) if f else None, "audio": dict(a) if a else None, "motor": dict(m) if m else None, "reflex": dict(r) if r else None}, "consensus": consensus}

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    email_norm = form_data.username.strip().lower()
    db_pool = await get_pool()
    async with db_pool.acquire() as conn:
        db_user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email_norm)
        if not db_user or not pwd_context.verify(form_data.password, db_user['password_hash']):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        access_token = create_access_token(data={"sub": str(db_user['user_id'])})
        return {"access_token": access_token, "token_type": "bearer", "user": {"user_id": str(db_user['user_id']), "name": db_user['name'], "email": db_user['email']}}

@app.post("/register")
async def register(user: UserRegister):
    db_pool = await get_pool()
    async with db_pool.acquire() as conn:
        hashed = pwd_context.hash(user.password)
        u_id = uuid.uuid4()
        await conn.execute("INSERT INTO users (user_id, name, email, password_hash) VALUES ($1, $2, $3, $4)", u_id, user.name, user.email.lower(), hashed)
        access_token = create_access_token(data={"sub": str(u_id)})
        return {"access_token": access_token, "token_type": "bearer", "user": {"user_id": str(u_id), "name": user.name, "email": user.email}}

@app.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    db_pool = await get_pool()
    async with db_pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT f.created_at, f.stroke_risk as f_stroke, f.parkinsons_risk as f_park, f.bells_palsy_risk as f_bells, a.als_risk as a_als
            FROM facemesh_results f
            LEFT JOIN audio_results a ON f.user_id = a.user_id AND ABS(EXTRACT(EPOCH FROM (f.created_at - a.created_at))) < 300
            WHERE f.user_id = $1 ORDER BY f.created_at DESC LIMIT 20
        ''', uuid.UUID(current_user['user_id']))
        return [dict(r) for r in rows]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
