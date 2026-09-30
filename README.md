# Bot-Like Behaviour Detection in Social Media Networks

> **Social and Multimedia Analytics — Undergraduate Project**

A complete analytical application to detect bot-like behaviour in social media networks using machine learning, NLP, and network analysis.

---

## Phase Status

| Phase | Description | Status |
| :--- | :--- | :---: |
| Phase 0 | Project Planning | ✅ |
| Phase 1 | Project Foundation | ✅ |
| Phase 2 | Data Preprocessing & EDA | ✅ |
| Phase 3 | Feature Engineering & Behaviour Analytics | ⏳ |
| Phase 4 | Machine Learning Pipeline | ⏳ |
| Phase 5 | NLP & Network Analysis | ⏳ |
| Phase 6 | Dashboard & Frontend Integration | ⏳ |
| Phase 7 | Account Investigation | ⏳ |
| Phase 8 | Testing & Documentation | ⏳ |

---

## Quick Start (Phase 1)

### Backend
```bash
# From project root
.venv\Scripts\activate
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You should see:
> **Backend connected successfully.**

---

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Axios, Lucide React
- **Backend**: Python 3.11, FastAPI, Uvicorn
- **Data / ML**: Pandas, NumPy, Scikit-learn, Joblib
- **NLP**: NLTK, VADER, TF-IDF, WordCloud
- **Network**: NetworkX
- **Database**: SQLite

---

## Dataset

Primary: **TwiBot-20** — a comprehensive Twitter bot detection benchmark.
See [`docs/DATASET.md`](docs/DATASET.md) for full details.

---

## Team

| Role | Member |
| :--- | :--- |
| Member 1 | Dataset, Preprocessing, Feature Engineering, ML, NLP |
| Member 2 | Project Setup, Backend API, Network Analysis, Frontend |
