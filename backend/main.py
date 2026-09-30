"""
Bot-Like Behaviour Detection — FastAPI Backend
Phase 1: Project Foundation
"""

import sqlite3
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    version="0.1.0",
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


# Startup is handled via the lifespan context manager above.


# ─────────────────────────────────────────────
# Routes
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
        "api_version": "0.1.0",
        "database": db_status,
    }
