"""
Bot-Like Behaviour Detection — FastAPI Backend
Phase 1 + Phase 2 + Phase 3 + Phase 4 (ML) + Phase 5 (NLP + Network)
"""

import sqlite3
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ─────────────────────────────────────────────
# Database Initialisation
# ─────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), "bot_detection.db")


def init_db():
    """Create database tables if they don't already exist."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS processing_log (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            phase       TEXT    NOT NULL,
            description TEXT    NOT NULL,
            timestamp   TEXT    DEFAULT (datetime('now'))
        )
        """
    )
    conn.commit()
    conn.close()


# ─────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks then yield control to the application."""
    init_db()
    print("[OK] Database initialised:", DB_PATH)
    yield


app = FastAPI(
    title="Bot-Like Behaviour Detection API",
    description="Backend API for detecting bot-like behaviour in social media networks.",
    version="0.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Phase 1 — Health
# ─────────────────────────────────────────────
@app.get("/api/health")
def health_check():
    """Health check endpoint — confirms the API is running and DB is reachable."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute("SELECT 1")
        conn.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "message": "Backend connected successfully.",
        "api_version": "0.4.0",
        "database": db_status,
    }


# ─────────────────────────────────────────────
# Phase 2 — Dataset API
# ─────────────────────────────────────────────
from preprocessing import (
    get_or_load,
    reload,
    get_dataset_summary,
    get_column_info,
    get_missing_values,
    get_class_distribution,
    get_duplicate_info,
    get_sample_records,
    get_basic_stats,
)


@app.get("/api/dataset/summary")
def dataset_summary():
    """High-level overview: rows, columns, bot/human counts, data availability."""
    try:
        df, meta = get_or_load()
        return get_dataset_summary(df, meta)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dataset/columns")
def dataset_columns():
    """Per-column metadata: dtype, null count, null %, unique count."""
    try:
        df, _ = get_or_load()
        return get_column_info(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dataset/missing")
def dataset_missing():
    """Columns with missing values, sorted descending by missing count."""
    try:
        df, _ = get_or_load()
        return get_missing_values(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dataset/distribution")
def dataset_distribution():
    """Bot vs human class distribution (counts + percentages)."""
    try:
        df, _ = get_or_load()
        return get_class_distribution(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dataset/duplicates")
def dataset_duplicates():
    """Count and percentage of fully-duplicate rows."""
    try:
        df, _ = get_or_load()
        return get_duplicate_info(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dataset/sample")
def dataset_sample(n: int = 10):
    """First n records from the dataset (capped at 50)."""
    try:
        df, _ = get_or_load()
        return get_sample_records(df, n=min(n, 50))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dataset/stats")
def dataset_stats():
    """Descriptive statistics for numeric columns."""
    try:
        df, _ = get_or_load()
        return get_basic_stats(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/dataset/reload")
def dataset_reload():
    """Force-reload the dataset (clears the in-memory cache)."""
    try:
        from feature_engineering import invalidate_cache
        df, meta = reload()
        invalidate_cache()
        return {"status": "ok", "rows": len(df), "is_demo": not meta.get("is_real_dataset")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# Phase 3 — Feature Engineering & Behaviour Analytics
# ─────────────────────────────────────────────
from feature_engineering import (
    get_feature_summary,
    get_feature_stats,
    get_behaviour_comparison,
    get_boolean_feature_rates,
    get_score_distributions,
    get_account_tier_distribution,
    get_top_suspicious_accounts,
    get_scatter_data,
)


@app.get("/api/features/summary")
def features_summary():
    """Phase 3 — Overview of all engineered features and labeled account counts."""
    try:
        return get_feature_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/features/stats")
def features_stats():
    """Phase 3 — Descriptive statistics (mean, median, std, percentiles) per feature, split bot vs human."""
    try:
        return get_feature_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/behaviour/comparison")
def behaviour_comparison():
    """Phase 3 — Bot vs human mean values across 10 key metrics (chart-ready)."""
    try:
        return get_behaviour_comparison()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/behaviour/boolean-rates")
def behaviour_boolean_rates():
    """Phase 3 — Percentage of bots vs humans with each boolean flag set to True."""
    try:
        return get_boolean_feature_rates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/behaviour/score-distributions")
def behaviour_score_distributions():
    """Phase 3 — Histogram distributions of activity_score and suspicion_score for bots vs humans."""
    try:
        return get_score_distributions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/behaviour/account-tiers")
def behaviour_account_tiers():
    """Phase 3 — Bot vs human count per follower-count tier (Nano/Micro/Mid/Macro/Mega)."""
    try:
        return get_account_tier_distribution()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/behaviour/top-suspicious")
def behaviour_top_suspicious(n: int = 20):
    """Phase 3 — Top-n most suspicious accounts by composite suspicion score."""
    try:
        return get_top_suspicious_accounts(n=min(n, 50))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/behaviour/scatter")
def behaviour_scatter(x: str = "ff_ratio", y: str = "tweets_per_day", max_points: int = 300):
    """Phase 3 — Scatter plot data (x, y, label) for any two numeric engineered features."""
    try:
        return get_scatter_data(x_feat=x, y_feat=y, max_points=min(max_points, 500))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# Phase 4 — Machine Learning Pipeline
# ─────────────────────────────────────────────
from ml_pipeline import (
    get_ml_status,
    get_ml_train,
    get_ml_metrics,
    get_ml_feature_importance,
    get_ml_confusion_matrix,
    get_ml_roc,
    get_ml_all_roc,
    invalidate_ml_cache,
)


@app.get("/api/ml/status")
def ml_status():
    """Phase 4 — Check whether models have been trained."""
    try:
        return get_ml_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/train")
def ml_train():
    """Phase 4 — Train (or re-use cached) Logistic Regression, Decision Tree, and Random Forest models."""
    try:
        return get_ml_train()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/metrics")
def ml_metrics():
    """Phase 4 — Per-model CV and hold-out metrics (accuracy, precision, recall, F1, ROC-AUC)."""
    try:
        return get_ml_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/feature-importance")
def ml_feature_importance(model: str = "Random Forest"):
    """Phase 4 — Feature importances for the given model (default: Random Forest)."""
    try:
        return get_ml_feature_importance(model_name=model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/confusion-matrix")
def ml_confusion_matrix(model: str = "Random Forest"):
    """Phase 4 — Confusion matrix for the given model on hold-out test set."""
    try:
        return get_ml_confusion_matrix(model_name=model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/roc")
def ml_roc(model: str = "Random Forest"):
    """Phase 4 — ROC curve data (fpr, tpr, auc) for a single model."""
    try:
        return get_ml_roc(model_name=model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/roc-all")
def ml_roc_all():
    """Phase 4 — ROC curve data for all three models (for overlay chart)."""
    try:
        return get_ml_all_roc()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# Phase 5 — NLP Analysis
# ─────────────────────────────────────────────
from nlp_analysis import (
    get_nlp_sentiment,
    get_nlp_tfidf,
    get_nlp_word_frequency,
    invalidate_nlp_cache,
)


@app.get("/api/nlp/sentiment")
def nlp_sentiment():
    """Phase 5 — VADER sentiment scores (compound, pos, neu, neg) for bot vs human tweets."""
    try:
        return get_nlp_sentiment()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nlp/tfidf")
def nlp_tfidf(top_n: int = 20):
    """Phase 5 — Top TF-IDF tokens (unigrams + bigrams) for bot vs human."""
    try:
        return get_nlp_tfidf(top_n=min(top_n, 50))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/nlp/word-frequency")
def nlp_word_frequency(top_n: int = 30):
    """Phase 5 — Word frequency counts for bot vs human tweet corpus."""
    try:
        return get_nlp_word_frequency(top_n=min(top_n, 50))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# Phase 5 — Network Analysis
# ─────────────────────────────────────────────
from network_analysis import (
    get_network_summary,
    get_network_metrics,
    get_network_degree_distribution,
    get_network_top_pagerank,
    get_network_label_metrics,
    invalidate_network_cache,
)


@app.get("/api/network/summary")
def network_summary():
    """Phase 5 — Graph summary: node count, edge count, density, avg degree."""
    try:
        return get_network_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/network/metrics")
def network_metrics(top_n: int = 30):
    """Phase 5 — Per-node metrics: degree, PageRank, in/out-degree, label."""
    try:
        return get_network_metrics(top_n=min(top_n, 100))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/network/degree-distribution")
def network_degree_distribution():
    """Phase 5 — Degree distribution histogram split by bot vs human."""
    try:
        return get_network_degree_distribution()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/network/top-pagerank")
def network_top_pagerank(n: int = 20):
    """Phase 5 — Top-n nodes by PageRank score."""
    try:
        return get_network_top_pagerank(n=min(n, 50))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/network/label-metrics")
def network_label_metrics():
    """Phase 5 — Average degree / PageRank grouped by label (bot vs human)."""
    try:
        return get_network_label_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# Phase 6 — Dashboard summary endpoint
# ─────────────────────────────────────────────
@app.get("/api/dashboard/summary")
def dashboard_summary():
    """Phase 6 — Aggregated stats for the Overview Dashboard."""
    try:
        from preprocessing import get_or_load
        df, meta = get_or_load()
        from feature_engineering import get_engineered_df
        edf = get_engineered_df()
        labeled = edf[edf["label"].isin(["bot", "human"])]
        bot_count   = int((labeled["label"] == "bot").sum())
        human_count = int((labeled["label"] == "human").sum())
        total       = bot_count + human_count
        bot_pct     = round(bot_count / total * 100, 1) if total else 0

        avg_suspicion = round(float(labeled["suspicion_score"].mean()), 2) if len(labeled) else 0

        # Best ML model
        best_model = {"model": "N/A", "test_accuracy": 0, "test_f1": 0}
        try:
            metrics = get_ml_metrics()
            if metrics:
                best_model = max(metrics, key=lambda m: m["test_f1"])
        except Exception:
            pass

        # Network summary
        net = {"total_nodes": 0, "total_edges": 0}
        try:
            net = get_network_summary()
        except Exception:
            pass

        return {
            "total_accounts": total,
            "bot_count":      bot_count,
            "human_count":    human_count,
            "bot_pct":        bot_pct,
            "avg_suspicion_score": avg_suspicion,
            "is_demo": not meta.get("is_real_dataset", False),
            "best_model": {
                "name":     best_model.get("model", "N/A"),
                "accuracy": best_model.get("test_accuracy", 0),
                "f1":       best_model.get("test_f1", 0),
            },
            "network": {
                "nodes": net.get("total_nodes", 0),
                "edges": net.get("total_edges", 0),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# Phase 7 — Account Investigation
# ─────────────────────────────────────────────
from account_investigation import (
    get_account_list,
    get_account_detail,
    get_search_suggestions,
    get_investigation_stats,
    invalidate_investigation_cache,
)


@app.get("/api/investigate/stats")
def investigate_stats():
    """Phase 7 — Overview counts: total, labeled, bot, human, high-risk, moderate-risk."""
    try:
        return get_investigation_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/investigate/accounts")
def investigate_accounts(
    page: int = 1,
    page_size: int = 50,
    label: str = "all",
    sort_by: str = "suspicion_score",
):
    """Phase 7 — Paginated account list. Filter by label, sort by any numeric feature."""
    try:
        return get_account_list(page=page, page_size=min(page_size, 100),
                                label_filter=label, sort_by=sort_by)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/investigate/account")
def investigate_account(query: str):
    """Phase 7 — Full investigation report for a single account (user_id or screen_name)."""
    try:
        result = get_account_detail(query)
        if not result.get("found"):
            raise HTTPException(status_code=404, detail=f"Account not found: {query}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/investigate/search")
def investigate_search(q: str, n: int = 10):
    """Phase 7 — Search accounts by screen_name or name (autocomplete)."""
    try:
        return get_search_suggestions(query=q, n=min(n, 20))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
