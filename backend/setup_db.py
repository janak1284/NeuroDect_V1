import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def setup():
    print("Setting up integrated multi-table schema...")
    if not DATABASE_URL:
        print("DATABASE_URL not found in .env")
        return

    conn = await asyncpg.connect(DATABASE_URL)
    
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

    # 2. FaceMesh (Smile) Results
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS facemesh_results (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Raw Biomarkers
            asymmetry_index FLOAT DEFAULT 0.0,
            h_shift FLOAT DEFAULT 0.0,
            v_shift FLOAT DEFAULT 0.0,
            expansion FLOAT DEFAULT 0.0,
            
            -- Risks
            stroke_risk FLOAT DEFAULT 0.0,
            bells_palsy_risk FLOAT DEFAULT 0.0,
            als_risk FLOAT DEFAULT 0.0,
            parkinsons_risk FLOAT DEFAULT 0.0
        );
    ''')

    # 3. Audio Results
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS audio_results (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Raw Biomarkers
            voice_jitter_pct FLOAT DEFAULT 0.0,
            acoustic_ms FLOAT DEFAULT 0.0,
            
            -- Risks
            stroke_risk FLOAT DEFAULT 0.0,
            bells_palsy_risk FLOAT DEFAULT 0.0,
            als_risk FLOAT DEFAULT 0.0,
            parkinsons_risk FLOAT DEFAULT 0.0
        );
    ''')

    # 4. Motor (Hand Stability) Results
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS motor_results (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Raw Biomarkers
            tremor_frequency_hz FLOAT DEFAULT 0.0,
            
            -- Risks
            stroke_risk FLOAT DEFAULT 0.0,
            bells_palsy_risk FLOAT DEFAULT 0.0,
            als_risk FLOAT DEFAULT 0.0,
            parkinsons_risk FLOAT DEFAULT 0.0
        );
    ''')

    # 5. Neural Reflex Results
    await conn.execute('''
        CREATE TABLE IF NOT EXISTS reflex_results (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Raw Biomarkers
            motor_ms FLOAT DEFAULT 0.0,
            facial_ms FLOAT DEFAULT 0.0,
            reflex_ms FLOAT DEFAULT 0.0,
            
            -- Risks
            stroke_risk FLOAT DEFAULT 0.0,
            bells_palsy_risk FLOAT DEFAULT 0.0,
            als_risk FLOAT DEFAULT 0.0,
            parkinsons_risk FLOAT DEFAULT 0.0
        );
    ''')

    print("Database refactor complete. Separate test tables created.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(setup())
