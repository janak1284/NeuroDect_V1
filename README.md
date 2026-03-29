# NeuroDect - Clinical AI Protocol

NeuroDect is an advanced web-based clinical AI platform designed for early experimental screening of neurological conditions such as Stroke, Parkinson's Disease, ALS (Bulbar), and Bell's Palsy. By leveraging client-side computer vision models and a robust backend analysis engine, NeuroDect evaluates multiple biometric markers in real time.

> ⚠️ **DISCLAIMER:** This experimental tool is not a substitute for professional clinical diagnosis.

---

## 🏗️ Architecture

NeuroDect is built on a modern, decoupled architecture:
1. **Frontend (Client):** A React (Vite) Single Page Application (SPA) that acts as the user interface and the primary data collection hub. It uses **MediaPipe** for client-side, privacy-preserving tracking of facial landmarks and hand tracking.
2. **Backend (Server):** A high-performance **FastAPI** Python server that ingests raw biometric deltas, applies clinical risk algorithms, and manages secure data storage.
3. **Database:** A **PostgreSQL** relational database for secure, normalized storage of user profiles and historical biomarker data points, enabling longitudinal tracking.

---

## 🔍 General Explanation

NeuroDect operates by guiding a user through a series of specialized biometric tests:
*   **Smile Test (Facial Symmetry):** Uses MediaPipe FaceMesh to measure micro-asymmetries and shifts during neutral and peak expressions.
*   **Hand Stability Test (Motor Function):** Uses MediaPipe Hands to track hand oscillation, calculating tremor frequency (Hz) and pathological drift.
*   **Acoustic Test (Vocal Biomarkers):** Measures audio features like jitter, shimmer, and phonation pause ratios.
*   **Neural Reflex Test:** Measures motor and facial reaction times (ms) to visual stimuli.

**The Flow:**
1. The user authenticates securely via JWT.
2. The frontend activates the user's camera/microphone locally. **Raw video and audio do not leave the client device.**
3. The frontend extracts "features" (e.g., coordinate lists, reaction times, or localized audio metrics) and sends *only* these numbers (the `raw_data`) to the backend.
4. The backend API (`/process_biometrics`) evaluates these features through a series of weighted algorithms to output specific disease risk percentages.
5. The data is saved to the PostgreSQL database.
6. Once all tests are completed, the frontend fetches an aggregated consensus (`/aggregate_results`) where the backend fuses data from all tables to present a holistic clinical risk profile.

---

## 🛠️ Implementation Details

### The Clinical Fusion Algorithm
Instead of relying on a single test, NeuroDect uses **Clinical Fusion**. For example, assessing **Stroke Risk** considers:
*   Facial asymmetry (60% weight) — computed from horizontal/vertical shifts in the Smile Test.
*   Motor drift (20% weight) — computed from the Hand Stability Test.
*   Reflex delay (20% weight) — computed from the Neural Reflex Test.

### Security & Privacy
*   **Edge Processing:** Heavy computer vision models (MediaPipe) run entirely in the browser using WebAssembly.
*   **Authentication:** Users are issued JWTs via `OAuth2PasswordBearer` and all backend endpoints are strictly protected. No unauthenticated data ingestion is permitted.

---

## ⚙️ Backend Explanation

The backend is built with **Python 3 and FastAPI**, optimized for asynchronous performance.

*   **File Structure:** Primary logic resides in `/backend/main.py`.
*   **Framework:** FastAPI for rapid API development with automated Swagger UI documentation.
*   **Concurrency:** Utilizes `asyncio` and `asyncpg` for non-blocking database operations, allowing high throughput during simultaneous test result submissions.
*   **Core Endpoints:**
    *   `POST /register` & `POST /login`: JWT user auth.
    *   `POST /process_biometrics`: Takes a `test_type` and `raw_data`, runs algorithmic risk evaluation, and commits to the database.
    *   `GET /aggregate_results`: Retrieves the most recent tests per user, fuses the scores, and returns a unified consensus array.
    *   `GET /history`: Returns longitudinal tracking data for user progression.

---

## 🎨 Frontend Explanation

The frontend is an interactive, highly dynamic workspace built with **React, Vite, and TailwindCSS**. 

*   **Styling & UX:** Tailwind is paired with **Framer Motion** for fluid page transitions, ensuring a premium "healthcare-grade" feel. Aesthetics rely on a carefully curated palette (teal, slate, and warm neutrals) and glassmorphism.
*   **Routing:** Custom state machine routing using standard React state (`stage` = `'intro'`, `'login'`, `'hub'`, `'test'`, `'analyzing'`, `'results'`) rather than URL-based routing, creating a contained application experience.
*   **Computer Vision:** Integrates `@mediapipe/face_mesh` and `@mediapipe/hands` directly into React component lifecycles to draw real-time overlays on `html5 <canvas>` elements over `<video>` feeds.

---

## 🗄️ Database Setup

The database is built on **PostgreSQL**. The schema is normalized and isolated based on biomarker domains.

**Key Tables:**
1.  **`users`**: Stores UUIDs, encrypted passwords (bcrypt), and profile data.
2.  **`facemesh_results`**: Stores `h_shift`, `v_shift`, `expansion`, and resulting facial risks.
3.  **`audio_results`**: Stores `voice_jitter_pct`, `acoustic_ms`.
4.  **`motor_results`**: Stores `tremor_frequency_hz`.
5.  **`reflex_results`**: Stores `motor_ms`, `facial_ms`, `reflex_ms`.

All result tables feature a cascading foreign key to `users(user_id)`.

---

## 🚀 Installation & Setup Guide

### Prerequisites
*   Node.js (v18+)
*   Python (3.9+)
*   PostgreSQL installed and running locally or via Docker.

### 1. Database Configuration
1. Create a PostgreSQL database (e.g., `neurodect_db`).
2. Navigate to the `backend` folder and copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your Postgres URL and a secure JWT string:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/neurodect_db
   SECRET_KEY=your-secure-random-string
   ```
4. Run the automated database setup script:
   ```bash
   cd backend
   python setup_db.py
   ```

### 2. Backend Setup
1. Open a terminal in the `backend` directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   python main.py
   ```
   *The server will run on `http://localhost:8000`.*

### 3. Frontend Setup
1. Open a second terminal in the project root folder.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Ensure your frontend `.env` or API configuration points to the server (default is usually `http://localhost:8000`).
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the local URL provided by Vite (e.g., `http://localhost:5173`).

---
