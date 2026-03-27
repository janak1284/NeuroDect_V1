```markdown
# Product Requirements Document: NeuroDect MVP

## Product Overview

**App Name:** NeuroDect  
**Tagline:** AI-powered early neurological screening using your laptop  
**Launch Goal:** Working demo + hackathon win  
**Target Launch:** 20 hours (hackathon build)

---

## Who It's For

### Primary User: Elderly Individuals
Elderly people or at-risk individuals who want to monitor their neurological health from home without frequent hospital visits.

**Their Current Pain:**
- Neurological diseases (stroke, Parkinson’s) detected too late
- Requires expensive hospital visits and specialists
- Subtle symptoms go unnoticed

**What They Need:**
- Simple at-home screening tool
- Early warning system
- Easy-to-understand results

---

### Example User Story
"Meet Ravi, a 65-year-old retiree who is concerned about tremors in his hand. Instead of visiting a hospital frequently, he uses NeuroDect weekly to monitor his condition. One day, the system detects abnormal tremor patterns and alerts him early, helping him seek timely medical help."

---

## The Problem We're Solving

Neurological disorders often go undetected in early stages because:
- Symptoms are subtle (micro-tremors, slight asymmetry, speech changes)
- Detection requires trained specialists
- Hospital visits are time-consuming and expensive

**Why Existing Solutions Fall Short:**
- Hospitals → Not accessible for frequent monitoring
- Wearables → Expensive and limited detection scope
- Self-observation → Not reliable

---

## User Journey

### Discovery → First Use → Success

1. **Discovery Phase**
   - Finds app during demo or recommendation
   - Attracted by “early detection using just a laptop”

2. **Onboarding**
   - Opens app → sees test dashboard
   - Grants camera & microphone permissions

3. **Core Usage**
   - Performs:
     - Smile test
     - Hand stability test
     - Speech test
     - Reaction test
   - System processes inputs in real-time

4. **Success Moment**
   - Sees risk score + visual explanation
   - Understands potential issue early

---

## MVP Features

### Must Have for Launch (P0)

#### 1. Facial Asymmetry Test
- **What:** Detects uneven facial movement (stroke indicator)
- **User Story:** As a user, I want to check my facial symmetry so that I can detect stroke symptoms early
- **Success Criteria:**
  - Detect facial landmarks using MediaPipe
  - Calculate asymmetry score
- **Priority:** P0

---

#### 2. Tremor Detection (Hand Stability)
- **What:** Detects hand tremors using motion tracking
- **User Story:** As a user, I want to measure hand stability so that I can identify Parkinson-like symptoms
- **Success Criteria:**
  - Capture hand coordinates
  - Perform frequency analysis (FFT)
- **Priority:** P0

---

#### 3. Voice Analysis
- **What:** Detects speech abnormalities
- **User Story:** As a user, I want to analyze my voice so that I can detect neurological speech issues
- **Success Criteria:**
  - Record audio
  - Extract features (jitter, shimmer)
- **Priority:** P0

---

#### 4. Reaction Test
- **What:** Measures cognitive response time
- **User Story:** As a user, I want to test reaction speed so that I can detect cognitive delays
- **Success Criteria:**
  - Record response time
  - Compare with baseline (~250ms)
- **Priority:** P0

---

#### 5. Dashboard (Risk Score + History)
- **What:** Displays overall neurological risk and past results
- **User Story:** As a user, I want to see my results clearly so that I can track changes over time
- **Success Criteria:**
  - Show test results
  - Display simple risk score
- **Priority:** P0

---

### Nice to Have (If Time Allows)

- Gmail reminders for weekly tests  
- Mobile camera via QR/WebRTC  

---

### NOT in MVP (Strict Scope Control)

- Full authentication system  
- Advanced ML model training  
- Clinical validation  

---

## How We'll Know It's Working

### Launch Metrics (Hackathon)

| Metric | Target | Measure |
|--------|--------|--------|
| Working demo | 100% | All tests functional |
| End-to-end flow | Complete | User can run all tests |

---

### Growth Metrics (Future)

| Metric | Target |
|--------|--------|
| Weekly users | 50+ |
| Test completion rate | >70% |

---

## Look & Feel

**Design Vibe:** Clean, clinical, minimal, futuristic  

**Visual Principles:**
1. High contrast for accessibility  
2. Minimal UI distractions  
3. Clear medical-style feedback  

---

### Key Screens

1. **Landing Page** – Intro + permissions  
2. **Test Dashboard** – All test options  
3. **Live Test Screen** – Camera + overlays  
4. **Results Dashboard** – Risk score + insights  

---

### Simple Wireframe

```

[Main Screen]
┌─────────────────────────┐
│     NeuroDect           │
├─────────────────────────┤
│  Smile   Voice   Hand   │
│  Reaction Test Buttons  │
├─────────────────────────┤
│   Start Screening       │
└─────────────────────────┘

```

---

## Technical Considerations

**Platform:** Web (Next.js + FastAPI)  
**Computer Vision:** MediaPipe (client-side)  
**Backend:** FastAPI (analysis)  
**Database:** Neon/PostgreSQL  

**Performance:**
- Real-time processing (10–15 FPS)
- Low latency (<1 sec feedback)

**Privacy:**
- No raw video stored  
- Only processed data used  

**Scalability:**
- Client-side processing reduces server load  

---

## Quality Standards

**Will NOT Accept:**
- Broken tests  
- Laggy UI  
- Incomplete user flow  

---

## Budget & Constraints

**Budget:** Free tools  
**Timeline:** 20 hours  
**Team:** Small hackathon team  

---

## Open Questions

- Exact threshold for risk scoring?  
- Accuracy vs speed trade-offs?  
- Demo mode needed?  

---

## Definition of Done

- [ ] All 4 tests working  
- [ ] Dashboard displays results  
- [ ] End-to-end demo works  
- [ ] Runs on browser (Chrome)  
- [ ] No crashes  

---

## Next Steps

1. Setup Next.js + FastAPI  
2. Integrate MediaPipe  
3. Implement tests  
4. Build dashboard  
5. Final demo polish  

---

**Status:** Ready for Development 🚀
```
