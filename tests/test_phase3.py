"""
Phase 3: Feature Engineering & Behaviour Analytics Tests

Tests:
1. engineer_features() produces expected columns
2. Composite scores are within valid ranges
3. Account tier bucketing
4. All Phase-3 API endpoints return expected structure
"""

import sys
import os
import pytest
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


# ─────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────

@pytest.fixture
def small_df():
    """Minimal preprocessed-style DataFrame for unit tests."""
    return pd.DataFrame({
        "user_id":          ["u1", "u2", "u3", "u4"],
        "label":            ["bot", "human", "bot", "human"],
        "label_int":        [1, 0, 1, 0],
        "followers_count":  [50,  5000, 10,    800],
        "friends_count":    [2000, 300, 5000,  250],
        "statuses_count":   [50,  3000, 5,    1500],
        "favourites_count": [10,  4000, 2,    2000],
        "listed_count":     [1,    80,  0,      40],
        "account_age_days": [30,   800, 60,   1200],
        "description_length": [0,   80,  0,     60],
        "default_profile":  [True, False, True, False],
        "default_profile_image": [True, False, False, False],
        "has_tweets":       [False, True, True, True],
        "description":      ["", "Tech lover", "", "Journalist"],
        "screen_name":      ["bot_1", "alice", "bot_2", "bob"],
        "name":             ["Bot One", "Alice", "Bot Two", "Bob"],
    })


@pytest.fixture
def engineered_df(small_df):
    from feature_engineering import engineer_features
    return engineer_features(small_df)


# ─────────────────────────────────────────────
# engineer_features() unit tests
# ─────────────────────────────────────────────

def test_ff_ratio_computed(engineered_df):
    """ff_ratio = followers / following (or followers if following=0)."""
    df = engineered_df
    assert "ff_ratio" in df.columns
    assert (df["ff_ratio"] >= 0).all()


def test_tweets_per_day_non_negative(engineered_df):
    assert (engineered_df["tweets_per_day"] >= 0).all()


def test_activity_score_range(engineered_df):
    score = engineered_df["activity_score"]
    assert score.between(0, 100).all(), "activity_score must be in [0, 100]"


def test_suspicion_score_range(engineered_df):
    score = engineered_df["suspicion_score"]
    assert score.between(0, 100).all(), "suspicion_score must be in [0, 100]"


def test_account_tier_values(engineered_df):
    valid_tiers = {"Nano", "Micro", "Mid", "Macro", "Mega"}
    assert set(engineered_df["account_tier"].unique()).issubset(valid_tiers)


def test_has_description_bool(engineered_df):
    assert engineered_df["has_description"].dtype == bool


def test_new_columns_added(engineered_df):
    expected = [
        "ff_ratio", "tweets_per_day", "favourites_per_day",
        "listed_per_follower", "has_description", "has_default_profile",
        "has_default_image", "activity_score", "suspicion_score", "account_tier",
    ]
    for col in expected:
        assert col in engineered_df.columns, f"Missing: {col}"


def test_original_not_mutated(small_df):
    """engineer_features must return a copy, not mutate the input."""
    from feature_engineering import engineer_features
    original_cols = set(small_df.columns)
    engineer_features(small_df)
    assert set(small_df.columns) == original_cols


# ─────────────────────────────────────────────
# Behaviour analytics functions
# ─────────────────────────────────────────────

@pytest.fixture
def mock_cache(small_df, monkeypatch):
    """Patch the feature_engineering cache to use small_df."""
    import feature_engineering as fe
    from feature_engineering import engineer_features
    patched_df = engineer_features(small_df)
    monkeypatch.setattr(fe, "_fe_cache", {"df": patched_df})
    return patched_df


def test_get_feature_summary(mock_cache):
    from feature_engineering import get_feature_summary
    result = get_feature_summary()
    assert "total_features" in result
    assert "labeled_accounts" in result
    assert result["labeled_accounts"] == 4
    assert result["bot_count"] == 2
    assert result["human_count"] == 2


def test_get_behaviour_comparison(mock_cache):
    from feature_engineering import get_behaviour_comparison
    result = get_behaviour_comparison()
    assert "comparison" in result
    assert isinstance(result["comparison"], list)
    assert len(result["comparison"]) > 0
    for entry in result["comparison"]:
        assert "metric" in entry
        assert "bot" in entry
        assert "human" in entry


def test_get_boolean_feature_rates(mock_cache):
    from feature_engineering import get_boolean_feature_rates
    result = get_boolean_feature_rates()
    assert isinstance(result, list)
    for entry in result:
        assert 0 <= entry["bot_pct"] <= 100
        assert 0 <= entry["human_pct"] <= 100


def test_get_score_distributions(mock_cache):
    from feature_engineering import get_score_distributions
    result = get_score_distributions()
    assert "activity_score" in result
    assert "suspicion_score" in result
    assert "bot" in result["suspicion_score"]
    assert "human" in result["suspicion_score"]


def test_get_account_tier_distribution(mock_cache):
    from feature_engineering import get_account_tier_distribution
    result = get_account_tier_distribution()
    tiers = [r["tier"] for r in result]
    assert "Nano" in tiers


def test_get_top_suspicious_accounts(mock_cache):
    from feature_engineering import get_top_suspicious_accounts
    result = get_top_suspicious_accounts(n=2)
    assert len(result) == 2
    # Should be sorted descending by suspicion_score
    if len(result) >= 2:
        assert result[0]["suspicion_score"] >= result[1]["suspicion_score"]


def test_get_scatter_data(mock_cache):
    from feature_engineering import get_scatter_data
    result = get_scatter_data(x_feat="ff_ratio", y_feat="tweets_per_day", max_points=10)
    assert isinstance(result, list)
    for pt in result:
        assert "x" in pt and "y" in pt and "label" in pt


# ─────────────────────────────────────────────
# Phase 3 API endpoints (via TestClient)
# ─────────────────────────────────────────────

@pytest.fixture
def api_client_p3(tmp_path, monkeypatch):
    import dataset_generator as dg
    import preprocessing as pp
    import feature_engineering as fe

    demo_p = str(tmp_path / "demo.json")
    proc_p = str(tmp_path / "proc.csv")
    monkeypatch.setattr(dg, "DEMO_PATH", demo_p)
    monkeypatch.setattr(dg, "RAW_DIR", str(tmp_path))
    monkeypatch.setattr(pp, "DEMO_DATA_PATH", demo_p)
    monkeypatch.setattr(pp, "REAL_DATA_PATH", str(tmp_path / "nope.json"))
    monkeypatch.setattr(pp, "PROCESSED_CSV", proc_p)
    monkeypatch.setattr(pp, "_cache", {})
    monkeypatch.setattr(fe, "_fe_cache", {})

    dg.generate_demo_dataset(n_human=30, n_bot=20)

    from fastapi.testclient import TestClient
    import main
    return TestClient(main.app)


def test_api_features_summary(api_client_p3):
    r = api_client_p3.get("/api/features/summary")
    assert r.status_code == 200
    data = r.json()
    assert "total_features" in data
    assert "bot_count" in data
    assert "human_count" in data


def test_api_features_stats(api_client_p3):
    r = api_client_p3.get("/api/features/stats")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) > 0


def test_api_behaviour_comparison(api_client_p3):
    r = api_client_p3.get("/api/behaviour/comparison")
    assert r.status_code == 200
    data = r.json()
    assert "comparison" in data
    assert len(data["comparison"]) > 0


def test_api_behaviour_boolean_rates(api_client_p3):
    r = api_client_p3.get("/api/behaviour/boolean-rates")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_api_behaviour_score_distributions(api_client_p3):
    r = api_client_p3.get("/api/behaviour/score-distributions")
    assert r.status_code == 200
    data = r.json()
    assert "suspicion_score" in data
    assert "activity_score" in data


def test_api_behaviour_account_tiers(api_client_p3):
    r = api_client_p3.get("/api/behaviour/account-tiers")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_api_behaviour_top_suspicious(api_client_p3):
    r = api_client_p3.get("/api/behaviour/top-suspicious?n=5")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) <= 5


def test_api_behaviour_scatter(api_client_p3):
    r = api_client_p3.get("/api/behaviour/scatter?x=ff_ratio&y=tweets_per_day&max_points=50")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
