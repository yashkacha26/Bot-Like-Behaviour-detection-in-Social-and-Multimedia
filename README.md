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
| Phase 3 | Feature Engineering & Behaviour Analytics | ✅ |
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

## Quick Start (Phase 3)

### New Backend Endpoints
| Endpoint | Description |
| :--- | :--- |
| `GET /api/features/summary` | Engineered feature list & labeled account counts |
| `GET /api/features/stats` | Per-feature bot vs human descriptive statistics |
| `GET /api/behaviour/comparison` | Mean values across 10 metrics (chart-ready) |
| `GET /api/behaviour/boolean-rates` | Boolean flag rates: bots vs humans |
| `GET /api/behaviour/score-distributions` | Histogram of activity/suspicion scores |
| `GET /api/behaviour/account-tiers` | Bot vs human per follower-tier bucket |
| `GET /api/behaviour/top-suspicious` | Top-N accounts by suspicion score |
| `GET /api/behaviour/scatter` | Scatter data for any two numeric features |

### New Frontend Page
Click **Behaviour Analytics** in the sidebar to view Phase 3 charts.

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
