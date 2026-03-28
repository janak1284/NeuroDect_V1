# Update: Neural Reflex Test Implementation
**Timestamp:** 2026-03-28 02:07:13

## 🧠 Key Implementation Details: "Neural Reflex Test"
This test is designed to provide dual-latency measurements (Motor + Facial) as biomarkers for the 4 target neurological diseases.

### 1. The Biomarkers
- **Motor Latency (ML):** Time from visual trigger to physical click. Primarily used for **Parkinson's** and **ALS** detection.
- **Facial Latency (FL):** Time from visual trigger to a smile (CN VII). Primarily used for **Acute Stroke** and **Bell's Palsy** detection.

### 2. Disease Dependence Matrix
The following table describes the dependence of each disease risk on the measured latencies:

| Disease | Primary Input | Baseline (ms) | Deviation Factor |
| :--- | :--- | :--- | :--- |
| **Parkinson's** | Motor RT | 250 | High (Bradykinesia indicator) |
| **Acute Stroke** | Facial RT | 300 | High (Brain signal interruption proxy) |
| **Bell's Palsy** | Facial RT | 300 | Critical (Direct CN VII nerve response) |
| **ALS** | Motor RT | 250 | Moderate (Motor neuron degradation) |

---

## 🏗️ Suggested FastAPI Backend Structure
(Archived as of March 28 Auth Update)

---

## 🚀 Performance & UI Optimization
**Timestamp:** 2026-03-28 22:45:00

### 1. UI & Flow Enhancements
- **Increased Frame Size:** Expanded test container to `max-w-5xl` with a `700px` minimum height for better visibility.
- **Test Sequence Pause:** Implemented a transition screen after the final test to allow users to pause before generating the report.

### 2. Hybrid "Zero-Lag" Architecture
- **Throttled Frontend Feed:** Enforced `640x480 @ 15fps` camera constraints using native `getUserMedia`. 
- **Client-Side Heavy Lifting:** All MediaPipe landmark detection now runs exclusively in the user's browser.
- **Non-Blocking Frame Dropping:** Replaced the sequential processing loop with a `requestAnimationFrame` handler.

---

## 🔐 User Authentication & Persistence (Latest)
**Timestamp:** 2026-03-28 15:20:00

### 1. Secure JWT-Based Auth System
- **Backend:** Implemented full authentication lifecycle in `main.py` using `FastAPI`, `OAuth2`, `python-jose` (JWT), and `passlib` (Bcrypt).
- **Security:** Argon2/Bcrypt password hashing and JWT token expiration (24h).
- **Endpoints:**
    - `POST /register`: Creates new user with UUID.
    - `POST /login`: Issues JWT tokens for valid credentials.
    - `GET /me`: Returns profile of the authenticated user.
- **Database:** Updated PostgreSQL `users` table to support `email` (unique) and `hashed_password`.

### 2. Frontend Auth Flow
- **Glassmorphism UI:** Created `src/components/Auth.jsx` featuring a high-aesthetic, animated login/register interface.
- **Persistent Sessions:** Tokens are securely stored in `localStorage` and managed via `src/lib/api.js`.
- **Protected Routing:** `src/Root.jsx` now acts as a gatekeeper, ensuring users are authenticated before accessing the diagnostic dashboard.
- **Header Integration:** Added user profile display and a logout mechanism to the main navigation bar.

### 3. Data Attribution
- **Longitudinal Tracking:** Test results sent via `analyzeResults` are now linked to the authenticated `user_id`, enabling historical trend analysis and personalized health reports.
- **Dashboard Profile:** The results dashboard now displays the patient's profile to ensure report authenticity.

---
**Status:** Authentication implemented; Data persistence linked to user profiles; Ready for longitudinal feature development.
