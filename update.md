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

### 3. Tech Stack & Detection Logic
- **Frontend:** React + MediaPipe Face Mesh.
- **Smile Logic:** Uses the ratio of **Mouth Width / Inter-Eye Distance** (scale-invariant).
- **Backend:** FastAPI (Python) for risk aggregation and diagnostic insight generation.

---

## 🏗️ Suggested FastAPI Backend Structure
Since the backend structure is not yet fully defined, the following is a recommended architecture for NeuroDect:

```
backend/
├── main.py                 # FastAPI Entry Point & App Init
├── requirements.txt        # Backend dependencies
├── api/                    # API Route Handlers
│   ├── reaction.py         # Neural Reflex endpoints
│   ├── audio.py            # Voice analysis endpoints
│   └── tremor.py           # Hand stability endpoints
├── core/                   # Shared configurations & middleware
│   └── config.py
├── schemas/                # Pydantic models for validation
│   └── reaction_schema.py
├── services/               # Diagnostic & Risk Logic (The "Brain")
│   ├── risk_engine.py      # Aggregates scores across tests
│   └── signal_processor.py # FFT, MFCC extraction, etc.
└── tests/                  # Backend unit & integration tests
```

---
**Status:** Implementation strategy finalized and initial backend created at `backend/main.py`.
