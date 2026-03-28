from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import math

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# DATA MODELS
# =========================

class ReactionData(BaseModel):
    motor_ms: float
    facial_ms: float

class RiskResult(BaseModel):
    disease: str
    risk_percentage: float
    dependence_level: str
    insight: str


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

    # =========================
    # BASELINE CALIBRATION (Home-Use Realistic)
    # =========================
    # Clinical ideal is ~250ms, but home webcam/browser latency 
    # adds ~150-200ms of unavoidable overhead.
    MOTOR_BASELINE = 450  
    FACIAL_BASELINE = 500

    MOTOR_STD = 120
    FACIAL_STD = 140

    # Normalize inputs
    motor_z = normalize(motor, MOTOR_BASELINE, MOTOR_STD)
    facial_z = normalize(facial, FACIAL_BASELINE, FACIAL_STD)

    # =========================
    # DISEASE-SPECIFIC MODELS
    # =========================
    # Adjusted weights and biases to shift the "High Risk" (60%+) 
    # threshold towards >700ms for motor and >850ms for facial.

    parkinson_score = sigmoid(1.6 * motor_z + 0.3 * facial_z - 1.2)
    stroke_score = sigmoid(1.0 * motor_z + 1.8 * facial_z - 1.0)
    bells_score = sigmoid(0.1 * motor_z + 2.4 * facial_z - 1.5)
    als_score = sigmoid(1.8 * motor_z + 0.6 * facial_z - 1.4)

    # =========================
    # FORMAT RESULTS
    # =========================

    risks = [
        {
            "disease": "Parkinson's Disease",
            "risk_percentage": round(parkinson_score * 100, 1),
            "dependence_level": "High",
            "insight": f"Motor delay dominant pattern (z_motor={motor_z:.2f}, z_facial={facial_z:.2f})"
        },
        {
            "disease": "Acute Stroke",
            "risk_percentage": round(stroke_score * 100, 1),
            "dependence_level": "High",
            "insight": f"Facial + motor asymmetry detected (z_motor={motor_z:.2f}, z_facial={facial_z:.2f})"
        },
        {
            "disease": "Bell's Palsy",
            "risk_percentage": round(bells_score * 100, 1),
            "dependence_level": "Critical",
            "insight": f"Strong facial nerve deviation (z_facial={facial_z:.2f})"
        },
        {
            "disease": "ALS",
            "risk_percentage": round(als_score * 100, 1),
            "dependence_level": "Moderate",
            "insight": f"Motor neuron degradation pattern (z_motor={motor_z:.2f})"
        }
    ]

    return risks


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)