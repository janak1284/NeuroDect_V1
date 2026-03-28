Perfect — now we’re at the **final step (Part 4)** 🔥
This is what actually makes your build **fast + structured + AI-assisted**.

Here is your **final `AGENTS.md` file** (clean, single markdown, tailored exactly for your NeuroDect project + stack):

---

```markdown id="neurodect-agents"
# AGENTS.md — NeuroDect MVP

## Project Overview

**Project Name:** NeuroDect  
**Type:** Web-based Multimodal AI Neurological Screening Tool  
**Stack:** Next.js + FastAPI + MediaPipe + Librosa + NumPy + Neon DB  
**Timeline:** 20-hour hackathon  

This project detects early neurological disorders using:
- Facial asymmetry (stroke detection)
- Hand tremor (Parkinson detection)
- Voice analysis (speech abnormalities)
- Reaction time (cognitive delay)

---

## 🚀 Core Development Philosophy

- Build **only MVP features**
- Prioritize **working demo over perfection**
- Use **AI assistance heavily**
- Avoid over-engineering
- Focus on **end-to-end flow first**

---

## 🧠 AI Agent Roles

### 1. Planner Agent
Responsible for:
- Breaking features into tasks
- Defining file structure
- Ensuring PRD alignment

**Prompt Template:**
```

Break this feature into step-by-step tasks:
[Feature description]
Stack: Next.js + FastAPI
Keep it hackathon-friendly

```

---

### 2. Code Generator Agent
Responsible for:
- Writing frontend and backend code
- Creating components and APIs

**Prompt Template:**
```

Create code for:
[Feature name]

Requirements:

* Stack: Next.js + FastAPI
* Clean and modular
* Minimal but working
* Include comments

```

---

### 3. Debugging Agent
Responsible for:
- Fixing errors
- Explaining issues
- Suggesting minimal fixes

**Prompt Template:**
```

Error:
[Paste error]

Context:
[What you were doing]

Fix it and explain simply.

```

---

### 4. Reviewer Agent
Responsible for:
- Checking correctness
- Ensuring feature completeness
- Suggesting improvements

**Prompt Template:**
```

Review this code:
[Paste code]

Check:

* Does it work?
* Any bugs?
* Can it be simplified?

```

---

## 🧱 Project Rules (VERY IMPORTANT)

### ✅ MUST FOLLOW

- Use **Next.js for frontend**
- Use **FastAPI for backend**
- Use **MediaPipe in browser (NOT backend)**
- Use **WebSocket for tremor data**
- Use **REST for audio + reaction**
- Keep code **modular and simple**

---

### ❌ DO NOT DO

- Do NOT stream raw video to backend  
- Do NOT build custom ML models  
- Do NOT overcomplicate UI  
- Do NOT add authentication  
- Do NOT waste time on edge cases  

---

## 📁 Folder Rules

### Frontend

```

frontend/
├── pages/
├── components/
├── lib/

```

### Backend

```

backend/
├── routes/
├── services/
├── models/

```

---

## ⚙️ Coding Standards

### Frontend (Next.js)

- Use functional components
- Use hooks (`useEffect`, `useState`)
- Keep components small
- Use Tailwind only

---

### Backend (FastAPI)

- Use async endpoints
- Separate logic into services
- Keep routes thin
- Use JSON responses

---

## 🔌 API Contracts

### WebSocket
`/ws/tremor`
- Input: hand landmark coordinates
- Output: tremor frequency

---

### REST APIs

#### POST /audio
- Input: audio file
- Output: voice features

#### POST /reaction
- Input: reaction times
- Output: average latency

#### GET /results
- Output: risk score

---

## 🧪 Testing Strategy

### Manual Testing (Hackathon)

- Test each feature individually:
  - Face detection works
  - Hand tracking works
  - Audio uploads work
  - Reaction test responds

- Then test full flow:
  - Run all tests → get risk score

---

## ⚡ Performance Rules

- Limit webcam resolution (640x480)
- Process every 2–3 frames
- Avoid blocking backend
- Use async everywhere

---

## 🔒 Privacy Rules

- NEVER store raw video
- ONLY store processed data
- Minimize user data

---

## 🏁 Hackathon Execution Plan

### Phase 1 (0–4 hrs)
- Setup Next.js + FastAPI
- Setup routing

### Phase 2 (4–10 hrs)
- MediaPipe integration
- Face + hand tracking

### Phase 3 (10–15 hrs)
- Backend processing (FFT + audio)

### Phase 4 (15–18 hrs)
- Dashboard UI
- Risk scoring

### Phase 5 (18–20 hrs)
- Debug + polish
- Demo prep

---

## 🎯 Definition of Done

- All 4 tests working
- Data flows frontend → backend → frontend
- Risk score displayed
- No crashes
- Demo works smoothly

---

## 🧠 AI Usage Strategy

| Task | Tool |
|------|------|
| Planning | ChatGPT / Claude |
| Coding | Cursor / Copilot |
| Debugging | ChatGPT |
| UI | v0 / ChatGPT |

---

## 🔥 Final Rule

> If something takes more than 30 minutes to fix → simplify it.

---

## 🚀 Mission

Build a **working, impressive, real-time AI system**  
—not a perfect one.

---

**Status:** Ready to Build  
**Mode:** Hackathon Execution  
```

---
