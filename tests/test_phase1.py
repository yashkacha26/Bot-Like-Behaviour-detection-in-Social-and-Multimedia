"""
Phase 1 Health Check Test
Tests that:
1. The FastAPI /api/health endpoint responds with HTTP 200.
2. The response JSON contains the expected keys.
3. The database reports 'connected'.
"""

import sys
import os
import sqlite3
import pytest

# Make sure the backend module is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))


def test_backend_imports():
    """Backend main module should import without errors."""
    import main  # noqa: F401
    assert True


def test_db_creation(tmp_path):
    """SQLite database should be created and accept a simple query."""
    db = tmp_path / "test.db"
    conn = sqlite3.connect(str(db))
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS processing_log (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            phase       TEXT,
            description TEXT,
            timestamp   TEXT DEFAULT (datetime('now'))
        )
        """
    )
    conn.commit()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='processing_log'")
    result = cursor.fetchone()
    conn.close()
    assert result is not None, "processing_log table was not created"
    assert result[0] == "processing_log"


def test_health_endpoint():
    """GET /api/health should return status='ok' and the expected keys."""
    from fastapi.testclient import TestClient
    import main

    client = TestClient(main.app)
    response = client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "message" in data
    assert "database" in data
    assert "api_version" in data
    assert "connected" in data["database"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
