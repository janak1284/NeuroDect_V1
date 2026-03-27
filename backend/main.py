from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReactionData(BaseModel):
    motor_ms: float
    facial_ms: float

class RiskResult(BaseModel):
    disease: str
    risk_percentage: float
    dependence_level: str
    insight: str

@app.post("/analyze_reaction", response_model=List[RiskResult])
async def analyze_reaction(data: ReactionData):
    motor = data.motor_ms
    facial = data.facial_ms

    # Normal Baselines: Motor ~250ms, Facial ~300ms
    # We calculate risk based on deviation from baseline
    
    risks = [
        {
            "disease": "Parkinson's Disease",
            "risk_percentage": round(min(98, max(5, ((motor - 250) / 10) * 2.5 + 10)), 1),
            "dependence_level": "High",
            "insight": f"Motor latency of {motor}ms indicates speed of muscle initiation."
        },
        {
            "disease": "Acute Stroke",
            "risk_percentage": round(min(98, max(5, ((facial - 300) / 10) * 3.0 + 8)), 1),
            "dependence_level": "High",
            "insight": f"Facial latency of {facial}ms is a proxy for central nervous system signal speed."
        },
        {
            "disease": "Bell's Palsy",
            "risk_percentage": round(min(98, max(5, ((facial - 300) / 10) * 4.0 + 5)), 1),
            "dependence_level": "Critical",
            "insight": "Measures direct cranial nerve VII (Facial Nerve) response."
        },
        {
            "disease": "ALS",
            "risk_percentage": round(min(98, max(5, ((motor - 250) / 10) * 1.8 + 12)), 1),
            "dependence_level": "Moderate",
            "insight": "Motor neuron degradation affects the neural-to-muscle conduction time."
        }
    ]

    return risks

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
