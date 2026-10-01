# Project Architecture

## System Overview
The system follows a 3-tier architecture with a React frontend, FastAPI backend, and SQLite database. All heavy computation (ML, NLP, graph analysis) runs server-side; the frontend purely renders results from REST endpoints.

### Pipeline (End-to-End)
1. **Data Loading & Preprocessing** — JSON → Pandas DataFrame, type coercion, account age calculation
2. **Exploratory Data Analysis** — summary stats, class distribution, missing value analysis
3. **Feature Engineering** — 10+ derived features: FF ratio, tweets/day, suspicion & activity scores, account tier
4. **Behaviour Analytics** — statistical bot vs human comparison across all engineered features
5. **Machine Learning** — Logistic Regression, Decision Tree, Random Forest with 5-fold CV
6. **NLP Analysis** — VADER sentiment, TF-IDF tokens, word frequency from tweet corpus
7. **Network Analysis** — NetworkX directed graph, PageRank, degree centrality
8. **Dashboard** — aggregated overview of all pipeline outputs
9. **Account Investigation** — per-account ML prediction, suspicion reasoning, population comparison

---

## Directory Structure
```
bot-like-behaviour-detection/
├── backend/
│   ├── main.py                   # FastAPI app + all endpoints (Phases 1–7)
│   ├── dataset_generator.py      # Synthetic TwiBot-20 demo data
│   ├── preprocessing.py          # Phase 2: data loading, type coercion, EDA
│   ├── feature_engineering.py    # Phase 3: derived features + behaviour analytics
│   ├── ml_pipeline.py            # Phase 4: ML training, CV, metrics, persistence
│   ├── nlp_analysis.py           # Phase 5: VADER, TF-IDF, word frequency
│   ├── network_analysis.py       # Phase 5: NetworkX graph + PageRank
│   ├── account_investigation.py  # Phase 7: per-account prediction & report
│   └── bot_detection.db          # SQLite database
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Phase 6: overview
│   │   │   ├── DatasetExplorer.jsx    # Phase 2: dataset EDA
│   │   │   ├── BehaviourAnalytics.jsx # Phase 3: feature stats
│   │   │   ├── MLAnalysis.jsx         # Phase 4: ML metrics & charts
│   │   │   ├── NLPAnalysis.jsx        # Phase 5: NLP charts
│   │   │   ├── NetworkAnalysis.jsx    # Phase 5: network charts
│   │   │   └── AccountInvestigation.jsx # Phase 7: investigation UI
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── ComingSoon.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   └── index.html
├── data/
│   ├── raw/           # TwiBot-20 JSON (real or demo)
│   └── processed/     # Preprocessed CSV cache
├── results/
│   ├── models/        # Joblib-serialised ML models
│   ├── figures/
│   └── metrics/
├── tests/
│   ├── test_phase1.py    # Health check & DB
│   ├── test_phase2.py    # Preprocessing & EDA
│   ├── test_phase3.py    # Feature engineering & behaviour analytics
│   ├── test_phase4.py    # ML pipeline
│   ├── test_phase5.py    # NLP & network analysis
│   └── test_phase6_7.py  # Dashboard & account investigation
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── TESTING.md
│   ├── DATASET.md
│   └── PROJECT_PLAN.md
├── README.md
├── requirements.txt
└── .gitignore
```

---

## Data Flow
- **Backend**: Pre-loads dataset on startup. Exposes 30+ REST endpoints across 7 phases.
- **Frontend**: Fetches endpoints via Axios and renders interactive Recharts visualisations.
- **ML Models**: Trained on request (`POST /api/ml/train`) and persisted in `results/models/` via joblib.
- **Caches**: Each backend module maintains an in-memory dict cache (invalidated on dataset reload).

---

## Key Design Decisions
| Decision | Rationale |
| :--- | :--- |
| FastAPI over Flask | Auto-generated OpenAPI docs, async support, type validation |
| Joblib over pickle | Safer serialisation, compression support for large models |
| Synthetic demo data | Allows full demo without requiring research dataset access |
| Frontend-agnostic API | All analytics are API-first; frontend is a presentation layer only |
| Stratified CV | Prevents class-imbalance bias in model evaluation |
