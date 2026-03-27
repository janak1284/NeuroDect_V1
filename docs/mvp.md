Here is your **complete Technical Design Document as a single clean `.md` file** — ready to copy, submit, or use in your project:

```markdown id="neurodect-tech-design-clean"
# Technical Design Document: NeuroDect MVP

## Executive Summary

**System:** NeuroDect  
**Version:** MVP 1.0  
**Architecture Pattern:** Hybrid Edge + Backend Processing  
**Timeline:** 20-hour hackathon  

NeuroDect is a browser-based neurological screening system that uses multimodal AI (vision, audio, cognitive tests) to detect early signs of neurological disorders such as stroke and Parkinson’s disease.

---

## Architecture Overview

### High-Level Architecture

```

Client (Next.js)
├── MediaPipe (Face + Hand Tracking)
├── Reaction Test (Frontend)
├── Audio Recorder
│
├── WebSocket → FastAPI (Tremor Data)
└── REST API → FastAPI (Audio + Reaction)

FastAPI Backend
├── Tremor Analysis (FFT)
├── Audio Processing (Librosa)
├── Risk Aggregation
│
└── Neon PostgreSQL (Storage)

Results → Dashboard (Next.js)

```

---

## Tech Stack

### Frontend
- Next.js (React)
- Tailwind CSS
- MediaPipe (Face Mesh + Hand Tracking)
- WebSockets (real-time data)

### Backend
- FastAPI (Python)
- asyncio (async handling)
- NumPy (signal processing)
- Librosa (audio analysis)
- Scikit-learn (risk logic / optional ML)

### Database
- Neon PostgreSQL

---

## Key Architectural Decisions

### 1. Client-Side Computer Vision
**Choice:** MediaPipe in browser (WASM)

**Why:**
- No video upload required
- Low latency
- Works on low-end devices

**Trade-off:**
- Slightly heavier frontend

---

### 2. Backend Signal Processing
**Choice:** FastAPI + Python

**Why:**
- Strong ecosystem (NumPy, Librosa)
- Async support for real-time data

**Trade-off:**
- Requires concurrency handling

---

### 3. Communication Protocols

| Data Type | Method |
|----------|--------|
| Hand Tracking | WebSocket |
| Audio | REST |
| Reaction | REST |

---

## Project Structure

### Frontend

```

frontend/
├── pages/
│   ├── index.tsx
│   ├── test.tsx
│   └── results.tsx
├── components/
│   ├── Camera.tsx
│   ├── FaceMesh.tsx
│   ├── HandTracker.tsx
│   ├── ReactionTest.tsx
│   └── Dashboard.tsx
├── lib/
│   ├── mediapipe.ts
│   ├── websocket.ts
│   └── api.ts

```

---

### Backend

```

backend/
├── main.py
├── routes/
│   ├── audio.py
│   ├── reaction.py
├── services/
│   ├── tremor.py
│   ├── asymmetry.py
│   ├── audio_features.py
│   └── risk.py
├── models/
│   └── schema.py

````

---

## Feature Implementation

### 1. Facial Asymmetry (Smile Test)

**Steps:**
1. Capture neutral face
2. Capture smile
3. Extract landmarks
4. Compute left-right difference

**Output:**
- Asymmetry score

---

### 2. Tremor Detection

**Steps:**
1. Capture hand coordinates
2. Send via WebSocket
3. Apply smoothing filter
4. Perform FFT

**Core Logic:**
```python
fft = np.fft.fft(signal)
freq = np.fft.fftfreq(len(signal))
````

**Detection:**

* Peak in 4–6 Hz → possible Parkinson tremor

---

### 3. Voice Analysis

**Steps:**

1. Record audio (5–10 sec)
2. Send to backend
3. Extract features

**Features:**

* Jitter
* Shimmer
* Harmonics-to-noise ratio

---

### 4. Reaction Test

**Steps:**

1. Random delay (1–3 sec)
2. User clicks on color change
3. Measure response time

**Output:**

* Average latency (~250 ms baseline)

---

### 5. Risk Aggregation

**Formula:**

```python
risk = w1*asymmetry + w2*tremor + w3*voice + w4*reaction
```

**Output:**

* Low / Medium / High risk

---

## API Design

### WebSocket

`/ws/tremor`

* Streams real-time hand coordinates

---

### REST APIs

#### POST /audio

* Input: audio file
* Output: extracted features

#### POST /reaction

* Input: reaction times
* Output: average latency

#### GET /results

* Output: aggregated risk score

---

## Database Schema

```sql
CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    asymmetry FLOAT,
    tremor FLOAT,
    voice FLOAT,
    reaction FLOAT,
    risk FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Performance Optimization

### Frontend

* Limit resolution to 640x480
* Process every 2–3 frames
* Use requestAnimationFrame

### Backend

* Async FastAPI endpoints
* Offload heavy computations

---

## Security & Privacy

* No raw video stored
* Only processed features stored
* Use HTTPS
* Minimal user data

---

## Deployment Plan

| Component | Platform         |
| --------- | ---------------- |
| Frontend  | Vercel           |
| Backend   | Railway / Render |
| Database  | Neon             |

---

## Cost Breakdown

| Service | Cost |
| ------- | ---- |
| Vercel  | Free |
| Railway | Free |
| Neon    | Free |

---

## Risk Mitigation

| Risk               | Mitigation               |
| ------------------ | ------------------------ |
| Performance issues | Reduce FPS               |
| Debug complexity   | Modular code             |
| Time shortage      | Prioritize core features |

---

## Hackathon Execution Plan (20 Hours)

### Hours 0–4

* Setup frontend + backend

### Hours 4–10

* MediaPipe integration (face + hand)

### Hours 10–15

* Backend processing (FFT + audio)

### Hours 15–18

* Dashboard + UI

### Hours 18–20

* Testing + polish

---

## Definition of Done

* All 4 tests working
* Risk score displayed
* End-to-end flow functional
* No crashes

---

## Future Scope

* Mobile camera (WebRTC)
* Gmail reminders
* Advanced ML models
* Doctor integration

---

**Status:** Ready for Implementation 🚀

```
