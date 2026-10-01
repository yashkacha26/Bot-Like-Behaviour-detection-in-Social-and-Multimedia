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
| Phase 4 | Machine Learning Pipeline | ✅ |
| Phase 5 | NLP & Network Analysis | ✅ |
| Phase 6 | Dashboard & Frontend Integration | ✅ |
| Phase 7 | Account Investigation | ✅ |
| Phase 8 | Testing & Documentation | ✅ |

---

## Quick Start

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

Open [http://localhost:5173](http://localhost:5173)

---

## API Endpoints

### Phase 1 — Health
| Endpoint | Description |
| :--- | :--- |
| `GET /api/health` | Backend health check |

### Phase 2 — Dataset
| Endpoint | Description |
| :--- | :--- |
| `GET /api/dataset/summary` | Dataset overview |
| `GET /api/dataset/columns` | Column metadata |
| `GET /api/dataset/stats` | Descriptive statistics |
| `POST /api/dataset/reload` | Force reload dataset |

### Phase 3 — Behaviour Analytics
| Endpoint | Description |
| :--- | :--- |
| `GET /api/features/summary` | Engineered feature list |
| `GET /api/behaviour/comparison` | Bot vs human mean values |
| `GET /api/behaviour/top-suspicious` | Top suspicious accounts |
| `GET /api/behaviour/scatter` | Scatter data for any two features |

### Phase 4 — Machine Learning
| Endpoint | Description |
| :--- | :--- |
| `POST /api/ml/train` | Train LR / DT / RF models |
| `GET /api/ml/metrics` | CV + hold-out metrics for all models |
| `GET /api/ml/feature-importance` | Feature importance scores |
| `GET /api/ml/confusion-matrix` | Confusion matrix |
| `GET /api/ml/roc-all` | ROC curves for all models |

### Phase 5 — NLP & Network
| Endpoint | Description |
| :--- | :--- |
| `GET /api/nlp/sentiment` | VADER sentiment (bot vs human) |
| `GET /api/nlp/tfidf` | TF-IDF top tokens |
| `GET /api/nlp/word-frequency` | Word frequency counts |
| `GET /api/network/summary` | Graph statistics |
| `GET /api/network/metrics` | Per-node degree & PageRank |
| `GET /api/network/label-metrics` | Avg metrics per label |

### Phase 7 — Account Investigation
| Endpoint | Description |
| :--- | :--- |
| `GET /api/investigate/stats` | Risk tier counts |
| `GET /api/investigate/accounts` | Paginated account list (filter + sort) |
| `GET /api/investigate/account?query=` | Full per-account report + ML prediction |
| `GET /api/investigate/search?q=` | Autocomplete search |

### Phase 8 — Testing & Documentation
See [`docs/TESTING.md`](docs/TESTING.md) — 89 tests across 6 test files.
See [`docs/API.md`](docs/API.md) — full API reference.
See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design.

---

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Axios, Lucide React
- **Backend**: Python 3.11, FastAPI, Uvicorn
- **Data / ML**: Pandas, NumPy, Scikit-learn, Joblib
- **NLP**: NLTK, VADER, TF-IDF
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
