# Database Schema: NeuroDect Neon DB

This document outlines the PostgreSQL database schema for the NeuroDect MVP, optimized for Neon DB. It supports longitudinal tracking of neurological biomarkers and calculated disease risks.

## 1. Core Tables

### `users`
Stores the unique identity of each screening participant.

| Column | Type | Description |
| :--- | :--- | :--- |
| `user_id` | `UUID` | Primary Key. Generated on the frontend and stored in localStorage. |
| `created_at` | `TIMESTAMP` | When the user first used the application. |
| `last_active` | `TIMESTAMP` | Updated on every screening session. |

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `screening_results`
Stores raw biomarkers and calculated risk percentages for every session.

| Column | Type | Description |
| :--- | :--- | :--- |
| `session_id` | `SERIAL` | Unique ID for each test session. |
| `user_id` | `UUID` | Foreign Key referencing `users(user_id)`. |
| `created_at` | `TIMESTAMP` | Timestamp of the screening. |
| `asymmetry_index` | `FLOAT` | Euclidean displacement delta from the Face Test. |
| `tremor_frequency_hz` | `FLOAT` | Peak frequency from the Motor Stability Test. |
| `voice_jitter_pct` | `FLOAT` | Cycle-to-cycle F0 variation from Acoustic Analysis. |
| `reaction_time_ms` | `FLOAT` | Latency from the Neural Reflex Test. |
| `stroke_risk_pct` | `FLOAT` | Calculated risk for Stroke/Bell's Palsy. |
| `parkinsons_risk_pct` | `FLOAT` | Calculated risk for Parkinson's Disease. |
| `essential_tremor_risk_pct` | `FLOAT` | Calculated risk for Essential Tremor. |
| `als_risk_pct` | `FLOAT` | Calculated risk for Amyotrophic Lateral Sclerosis. |
| `overall_risk_score` | `FLOAT` | Weighted aggregate for the main dashboard gauge. |

```sql
CREATE TABLE screening_results (
    session_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Raw Biomarkers
    asymmetry_index FLOAT,        
    tremor_frequency_hz FLOAT,    
    voice_jitter_pct FLOAT,       
    reaction_time_ms FLOAT,       

    -- Calculated Disease Risks (0.0% to 100.0%)
    stroke_risk_pct FLOAT,             
    parkinsons_risk_pct FLOAT,         
    essential_tremor_risk_pct FLOAT,   
    als_risk_pct FLOAT,                

    -- Aggregated Score
    overall_risk_score FLOAT           
);
```

## 2. Indexes

To optimize for longitudinal queries (e.g., fetching a user's last 5 tests), the following index is applied:

```sql
CREATE INDEX idx_user_results ON screening_results(user_id, created_at DESC);
```

## 3. Disease Logic Mapping

*   **Stroke Risk:** Heavily weighted on `asymmetry_index` and `reaction_time_ms`.
*   **Parkinson's Risk:** Composite of `tremor_frequency_hz` (4-6Hz band) and `reaction_time_ms`.
*   **Essential Tremor Risk:** Primary weighting on `tremor_frequency_hz` (4-10Hz band).
*   **ALS Risk:** Weighted heavily on `voice_jitter_pct` (Bulbar onset proxy) and `reaction_time_ms` (neuromotor execution).
