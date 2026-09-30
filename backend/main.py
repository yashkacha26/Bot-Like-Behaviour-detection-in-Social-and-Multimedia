"""
Bot-Like Behaviour Detection — FastAPI Backend
Phase 1 + Phase 2
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
    version="0.2.0",
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
        "api_version": "0.2.0",
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
        df, meta = reload()
        return {"status": "ok", "rows": len(df), "is_demo": not meta.get("is_real_dataset")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
