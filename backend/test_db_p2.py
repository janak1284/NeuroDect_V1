import psycopg2
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def test_db():
    print("--- PSYCOPG2 DB TEST START ---")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    try:
        print("Attempting to connect...")
        conn = psycopg2.connect(DATABASE_URL)
        print("Connected successfully!")
        cur = conn.cursor()

        # 1. Create a test user
        user_id = str(uuid.uuid4())
        print(f"Creating test user: {user_id}")
        cur.execute("INSERT INTO users (user_id, name, email, password_hash) VALUES (%s, %s, %s, %s)", 
                    (user_id, "Test User Psycopg2", f"test_p2_{user_id[:6]}@example.com", "dummy_hash"))
        print("Test user created.")

        # 2. Insert into facemesh_results
        print("Inserting into facemesh_results...")
        cur.execute('''
            INSERT INTO facemesh_results (user_id, asymmetry_index, h_shift, v_shift, expansion, stroke_risk, bells_palsy_risk, als_risk, parkinsons_risk)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (user_id, 0.05, 0.02, 0.01, 0.08, 15.0, 10.0, 12.0, 8.0))
        print("Inserted into facemesh_results")

        # 3. Fetch back
        print("Fetching results back...")
        cur.execute("SELECT * FROM facemesh_results WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        if row:
            print(f"Fetched results: {row}")
        else:
            print("Error: Could not fetch results back!")

        # 4. Clean up
        print("Cleaning up test user...")
        cur.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        print("Cleaned up test user")

        conn.commit()
        cur.close()
        conn.close()
        print("Connection closed. Test passed!")
    except Exception as e:
        print(f"Psycopg2 test failed: {e}")
    print("--- PSYCOPG2 DB TEST END ---")

if __name__ == "__main__":
    test_db()
