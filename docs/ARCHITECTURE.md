# Project Architecture

## System Overview
The system follows a typical 3-tier architecture with a React frontend, FastAPI backend, and an SQLite database for persistence. 

### Pipeline
1.  **Data Loading & Preprocessing**: Loads dataset into Pandas DataFrames, handles missing values, and validates types.
2.  **Exploratory Data Analysis (EDA)**: Summarizes data metrics (distribution, nulls, feature insights).
3.  **Feature Engineering**: Derives meaningful metrics like followers/following ratio, tweets/day.
4.  **Specialized Analytics**:
    *   **Behaviour Analysis**: Statistical comparison of bot vs human metrics.
    *   **NLP Analysis**: Sentiment analysis (VADER), TF-IDF, and word clouds on tweet text.
    *   **Network Analysis**: PageRank and degree centrality using NetworkX on follower graphs.
5.  **Machine Learning**: Logistic Regression, Decision Tree, Random Forest models predict bot probability.
6.  **Presentation Layer**: A React dashboard to visualize metrics and allow specific account investigation.

## Directory Structure
```
bot-like-behaviour-detection/
├── frontend/             # React + Vite Application
├── backend/              # FastAPI Application
│   ├── preprocessing.py
│   ├── feature_engineering.py
│   ├── ml_models.py
│   ├── nlp_analysis.py
│   ├── network_analysis.py
│   └── trained_models/
├── data/
│   ├── raw/              # Raw dataset JSON/CSV files
│   └── processed/        # Cleaned dataset ready for ML
├── results/
│   ├── figures/
│   └── metrics/
├── tests/                # Application Tests
├── docs/                 # Documentation
├── README.md
├── requirements.txt
└── .gitignore
```

## Data Flow
*   **Backend**: Pre-loads the dataset/models on startup or on-demand. Exposes RESTful endpoints (e.g., `/api/dataset/summary`, `/api/ml/predict`).
*   **Frontend**: Consumes these endpoints using Axios and renders interactive charts with Recharts. No raw data processing happens on the client; all heavy lifting is handled by Python.
