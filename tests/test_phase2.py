"""
Phase 2: Data Preprocessing + EDA Tests

Tests:
1. Dataset generator produces correct structure
2. Preprocessing pipeline loads and coerces types correctly
3. EDA functions return correct shapes
4. All API endpoints return expected status codes and keys
"""

import sys
import os
import json
import pytest
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


# ─────────────────────────────────────────────
# Dataset Generator
# ─────────────────────────────────────────────
def test_generator_creates_file(tmp_path, monkeypatch):
    """generate_demo_dataset() should create a valid JSON file."""
    import dataset_generator as dg
    monkeypatch.setattr(dg, "DEMO_PATH", str(tmp_path / "test_demo.json"))
    monkeypatch.setattr(dg, "RAW_DIR", str(tmp_path))

    path = dg.generate_demo_dataset(n_human=20, n_bot=10)
    assert os.path.exists(path)

    with open(path) as f:
        data = json.load(f)

    assert len(data) == 30
    labels = {d["label"] for d in data}
    assert "bot" in labels and "human" in labels


def test_generator_schema(tmp_path, monkeypatch):
    """Every generated account must have ID, profile, label fields."""
    import dataset_generator as dg
    monkeypatch.setattr(dg, "DEMO_PATH", str(tmp_path / "demo2.json"))
    monkeypatch.setattr(dg, "RAW_DIR", str(tmp_path))

    path = dg.generate_demo_dataset(n_human=5, n_bot=5)
    with open(path) as f:
        data = json.load(f)

    for entry in data:
        assert "ID" in entry
        assert "profile" in entry
        assert "label" in entry
        assert entry["label"] in {"bot", "human"}
        assert "followers_count" in entry["profile"]
        assert "friends_count" in entry["profile"]
        assert "statuses_count" in entry["profile"]
        assert "created_at" in entry["profile"]


# ─────────────────────────────────────────────
# Preprocessing Pipeline
# ─────────────────────────────────────────────
@pytest.fixture
def demo_df(tmp_path, monkeypatch):
    """Generate a small demo dataset and preprocess it."""
    import dataset_generator as dg
    import preprocessing as pp

    demo_p = str(tmp_path / "demo.json")
    proc_p = str(tmp_path / "proc.csv")

    monkeypatch.setattr(dg, "DEMO_PATH", demo_p)
    monkeypatch.setattr(dg, "RAW_DIR",   str(tmp_path))
    monkeypatch.setattr(pp, "DEMO_DATA_PATH", demo_p)
    monkeypatch.setattr(pp, "REAL_DATA_PATH", str(tmp_path / "nonexistent.json"))
    monkeypatch.setattr(pp, "PROCESSED_CSV",  proc_p)
    monkeypatch.setattr(pp, "_cache",         {})

    dg.generate_demo_dataset(n_human=30, n_bot=20)
    df, meta = pp.preprocess()
    return df, meta


def test_preprocessing_loads(demo_df):
    df, meta = demo_df
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 50


def test_preprocessing_columns(demo_df):
    df, _ = demo_df
    for col in ["user_id", "followers_count", "friends_count", "statuses_count",
                "label", "label_int", "account_age_days", "tweets_per_day",
                "followers_following_ratio"]:
        assert col in df.columns, f"Missing column: {col}"


def test_preprocessing_labels(demo_df):
    df, _ = demo_df
    assert set(df["label"].dropna().unique()) == {"bot", "human"}
    assert df["label_int"].isin([0, 1]).all()


def test_no_target_leakage(demo_df):
    """label_int must be derived from label only — not from raw profile."""
    df, _ = demo_df
    # Spot-check: bot → 1, human → 0
    bots   = df[df["label"] == "bot"]["label_int"]
    humans = df[df["label"] == "human"]["label_int"]
    assert (bots == 1).all()
    assert (humans == 0).all()


def test_numeric_types(demo_df):
    df, _ = demo_df
    for col in ["followers_count", "friends_count", "statuses_count"]:
        assert pd.api.types.is_numeric_dtype(df[col]), f"{col} should be numeric"


# ─────────────────────────────────────────────
# EDA Functions
# ─────────────────────────────────────────────
def test_class_distribution(demo_df):
    from preprocessing import get_class_distribution
    df, _ = demo_df
    dist = get_class_distribution(df)
    assert isinstance(dist, list)
    labels = {d["label"] for d in dist}
    assert "bot" in labels and "human" in labels
    for d in dist:
        assert 0 <= d["percentage"] <= 100


def test_missing_values(demo_df):
    from preprocessing import get_missing_values
    df, _ = demo_df
    mv = get_missing_values(df)
    assert isinstance(mv, list)
    if mv:
        assert all("column" in m and "missing_count" in m for m in mv)


def test_dataset_summary(demo_df):
    from preprocessing import get_dataset_summary
    df, meta = demo_df
    summary = get_dataset_summary(df, meta)
    assert "total_rows" in summary
    assert "bot_count" in summary
    assert "human_count" in summary
    assert summary["total_rows"] == len(df)


def test_sample_records(demo_df):
    from preprocessing import get_sample_records
    df, _ = demo_df
    records = get_sample_records(df, n=5)
    assert len(records) == 5
    assert isinstance(records[0], dict)


# ─────────────────────────────────────────────
# API Endpoints
# ─────────────────────────────────────────────
@pytest.fixture
def api_client(tmp_path, monkeypatch):
    """Set up a test client with a small demo dataset."""
    import dataset_generator as dg
    import preprocessing as pp

    demo_p = str(tmp_path / "demo.json")
    proc_p = str(tmp_path / "proc.csv")

    monkeypatch.setattr(dg, "DEMO_PATH",      demo_p)
    monkeypatch.setattr(dg, "RAW_DIR",        str(tmp_path))
    monkeypatch.setattr(pp, "DEMO_DATA_PATH", demo_p)
    monkeypatch.setattr(pp, "REAL_DATA_PATH", str(tmp_path / "nope.json"))
    monkeypatch.setattr(pp, "PROCESSED_CSV",  proc_p)
    monkeypatch.setattr(pp, "_cache",         {})

    dg.generate_demo_dataset(n_human=30, n_bot=20)

    from fastapi.testclient import TestClient
    import main
    return TestClient(main.app)


def test_api_health(api_client):
    r = api_client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_api_summary(api_client):
    r = api_client.get("/api/dataset/summary")
    assert r.status_code == 200
    d = r.json()
    assert "total_rows" in d
    assert d["total_rows"] == 50


def test_api_distribution(api_client):
    r = api_client.get("/api/dataset/distribution")
    assert r.status_code == 200
    dist = r.json()
    assert isinstance(dist, list)
    assert len(dist) >= 2


def test_api_sample(api_client):
    r = api_client.get("/api/dataset/sample?n=5")
    assert r.status_code == 200
    assert len(r.json()) == 5


def test_api_missing(api_client):
    r = api_client.get("/api/dataset/missing")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_api_columns(api_client):
    r = api_client.get("/api/dataset/columns")
    assert r.status_code == 200
    cols = r.json()
    assert isinstance(cols, list)
    col_names = [c["column"] for c in cols]
    assert "label" in col_names
    assert "followers_count" in col_names


def test_api_stats(api_client):
    r = api_client.get("/api/dataset/stats")
    assert r.status_code == 200
    assert "followers_count" in r.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
