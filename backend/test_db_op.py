import asyncio
import asyncpg
import os
import uuid
import sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def test_db():
    print("--- DB TEST START ---")
    print(f"Python version: {sys.version}")
    print(f"DATABASE_URL (masked): {DATABASE_URL[:20]}...")
    
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    try:
        print("Attempting to connect...")
        conn = await asyncpg.connect(DATABASE_URL)
        print("Connected successfully!")

        # 1. Create a test user
        user_id = uuid.uuid4()
        print(f"Creating test user: {user_id}")
        await conn.execute("INSERT INTO users (user_id, name, email, password_hash) VALUES ($1, $2, $3, $4)", 
                           user_id, "Test User", f"test_{user_id.hex[:6]}@example.com", "dummy_hash")
        print("Test user created.")

        # 2. Insert into facemesh_results
        print("Inserting into facemesh_results...")
        await conn.execute('''
            INSERT INTO facemesh_results (user_id, asymmetry_index, h_shift, v_shift, expansion, stroke_risk, bells_palsy_risk, als_risk, parkinsons_risk)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ''', user_id, 0.05, 0.02, 0.01, 0.08, 15.0, 10.0, 12.0, 8.0)
        print("Inserted into facemesh_results")

        # 3. Fetch back
        print("Fetching results back...")
        row = await conn.fetchrow("SELECT * FROM facemesh_results WHERE user_id = $1", user_id)
        if row:
            print(f"Fetched results: {dict(row)}")
        else:
            print("Error: Could not fetch results back!")

        # 4. Clean up
        print("Cleaning up test user...")
        await conn.execute("DELETE FROM users WHERE user_id = $1", user_id)
        print("Cleaned up test user")

        await conn.close()
        print("Connection closed. Test passed!")
    except Exception as e:
        print(f"Database test failed: {type(e).__name__}: {e}")
    print("--- DB TEST END ---")

if __name__ == "__main__":
    try:
        asyncio.run(test_db())
    except Exception as e:
        print(f"Main execution failed: {e}")
