"""
Phase 6 & 7: Dashboard & Account Investigation Tests

Tests:
1. Dashboard summary endpoint returns all required keys
2. Investigation stats endpoint returns correct keys
3. Account list is paginated correctly
4. Account detail returns full report structure
5. Account not found returns 404
6. Search suggestions return valid results
7. Verdict logic is correct for known suspicion scores
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
def patched_env(tmp_path, monkeypatch):
    """Full isolated environment for Phase 6 & 7 tests."""
    import dataset_generator as dg
    import preprocessing as pp
    import feature_engineering as fe
    import ml_pipeline as ml
    import nlp_analysis as nlp
    import network_analysis as net
    import account_investigation as ai

    demo_p     = str(tmp_path / "demo.json")
    proc_p     = str(tmp_path / "proc.csv")
    models_dir = str(tmp_path / "models")
    os.makedirs(models_dir, exist_ok=True)

    monkeypatch.setattr(dg, "DEMO_PATH", demo_p)
    monkeypatch.setattr(dg, "RAW_DIR", str(tmp_path))
    monkeypatch.setattr(pp, "DEMO_DATA_PATH", demo_p)
    monkeypatch.setattr(pp, "REAL_DATA_PATH", str(tmp_path / "nope.json"))
    monkeypatch.setattr(pp, "PROCESSED_CSV", proc_p)
    monkeypatch.setattr(pp, "_cache", {})
    monkeypatch.setattr(fe, "_fe_cache", {})
    monkeypatch.setattr(ml, "_ml_cache", {})
    monkeypatch.setattr(ml, "MODELS_DIR", models_dir)
    monkeypatch.setattr(nlp, "_nlp_cache", {})
    monkeypatch.setattr(net, "_net_cache", {})
    monkeypatch.setattr(ai, "_centroid_cache", {})

    dg.generate_demo_dataset(n_human=60, n_bot=40)
    return tmp_path


@pytest.fixture
def api_client(tmp_path, monkeypatch):
    """TestClient wired with isolated environment."""
    import dataset_generator as dg
    import preprocessing as pp
    import feature_engineering as fe
    import ml_pipeline as ml
    import nlp_analysis as nlp
    import network_analysis as net
    import account_investigation as ai

    demo_p     = str(tmp_path / "demo.json")
    proc_p     = str(tmp_path / "proc.csv")
    models_dir = str(tmp_path / "models")
    os.makedirs(models_dir, exist_ok=True)

    monkeypatch.setattr(dg, "DEMO_PATH", demo_p)
    monkeypatch.setattr(dg, "RAW_DIR", str(tmp_path))
    monkeypatch.setattr(pp, "DEMO_DATA_PATH", demo_p)
    monkeypatch.setattr(pp, "REAL_DATA_PATH", str(tmp_path / "nope.json"))
    monkeypatch.setattr(pp, "PROCESSED_CSV", proc_p)
    monkeypatch.setattr(pp, "_cache", {})
    monkeypatch.setattr(fe, "_fe_cache", {})
    monkeypatch.setattr(ml, "_ml_cache", {})
    monkeypatch.setattr(ml, "MODELS_DIR", models_dir)
    monkeypatch.setattr(nlp, "_nlp_cache", {})
    monkeypatch.setattr(net, "_net_cache", {})
    monkeypatch.setattr(ai, "_centroid_cache", {})

    dg.generate_demo_dataset(n_human=60, n_bot=40)

    from fastapi.testclient import TestClient
    import main
    return TestClient(main.app)


# ─────────────────────────────────────────────
# Phase 6: Dashboard
# ─────────────────────────────────────────────

def test_api_dashboard_summary_keys(api_client):
    """Dashboard summary must return all expected top-level keys."""
    r = api_client.get("/api/dashboard/summary")
    assert r.status_code == 200
    data = r.json()
    for key in ["total_accounts", "bot_count", "human_count",
                "bot_pct", "avg_suspicion_score", "is_demo", "best_model", "network"]:
        assert key in data, f"Missing key: {key}"


def test_api_dashboard_bot_pct_valid(api_client):
    """bot_pct must be in [0, 100]."""
    r = api_client.get("/api/dashboard/summary")
    assert 0.0 <= r.json()["bot_pct"] <= 100.0


def test_api_dashboard_counts_consistent(api_client):
    """bot_count + human_count must equal total_accounts."""
    r  = api_client.get("/api/dashboard/summary")
    d  = r.json()
    assert d["bot_count"] + d["human_count"] == d["total_accounts"]


def test_api_dashboard_suspicion_range(api_client):
    """avg_suspicion_score must be in [0, 100]."""
    r = api_client.get("/api/dashboard/summary")
    assert 0.0 <= r.json()["avg_suspicion_score"] <= 100.0


# ─────────────────────────────────────────────
# Phase 7: Investigation Stats
# ─────────────────────────────────────────────

def test_api_investigate_stats_keys(api_client):
    """Investigation stats must return required keys."""
    r = api_client.get("/api/investigate/stats")
    assert r.status_code == 200
    data = r.json()
    for key in ["total_accounts", "labeled_accounts", "bot_count",
                "human_count", "high_risk_count", "moderate_risk_count"]:
        assert key in data, f"Missing key: {key}"


def test_api_investigate_stats_consistency(api_client):
    """high_risk + moderate_risk must not exceed labeled_accounts."""
    r = api_client.get("/api/investigate/stats")
    d = r.json()
    assert d["high_risk_count"] + d["moderate_risk_count"] <= d["labeled_accounts"]


def test_api_investigate_stats_counts(api_client):
    """bot_count + human_count should equal labeled_accounts."""
    r = api_client.get("/api/investigate/stats")
    d = r.json()
    assert d["bot_count"] + d["human_count"] == d["labeled_accounts"]


# ─────────────────────────────────────────────
# Phase 7: Account List (Pagination)
# ─────────────────────────────────────────────

def test_api_investigate_accounts_default(api_client):
    """Default account list must return pagination metadata."""
    r = api_client.get("/api/investigate/accounts")
    assert r.status_code == 200
    data = r.json()
    for key in ["total", "page", "page_size", "pages", "accounts"]:
        assert key in data, f"Missing key: {key}"


def test_api_investigate_accounts_page_size(api_client):
    """Account list must respect page_size parameter."""
    r = api_client.get("/api/investigate/accounts?page_size=5")
    assert r.status_code == 200
    data = r.json()
    assert len(data["accounts"]) <= 5


def test_api_investigate_accounts_bot_filter(api_client):
    """Filtering by label=bot must return only bot accounts."""
    r = api_client.get("/api/investigate/accounts?label=bot&page_size=20")
    assert r.status_code == 200
    data = r.json()
    for acc in data["accounts"]:
        assert acc["label"] == "bot"


def test_api_investigate_accounts_human_filter(api_client):
    """Filtering by label=human must return only human accounts."""
    r = api_client.get("/api/investigate/accounts?label=human&page_size=20")
    assert r.status_code == 200
    data = r.json()
    for acc in data["accounts"]:
        assert acc["label"] == "human"


def test_api_investigate_accounts_sorted_descending(api_client):
    """Default sort (suspicion_score) must be descending."""
    r = api_client.get("/api/investigate/accounts?page_size=10")
    data = r.json()
    scores = [a.get("suspicion_score", 0) for a in data["accounts"]]
    assert scores == sorted(scores, reverse=True)


# ─────────────────────────────────────────────
# Phase 7: Account Detail
# ─────────────────────────────────────────────

def test_api_investigate_account_found(api_client):
    """Querying a real account must return found=True with all report keys."""
    # First get an account from the list
    list_r = api_client.get("/api/investigate/accounts?page_size=1")
    accounts = list_r.json()["accounts"]
    assert len(accounts) > 0
    screen_name = accounts[0].get("screen_name", accounts[0].get("user_id"))

    r = api_client.get(f"/api/investigate/account?query={screen_name}")
    assert r.status_code == 200
    data = r.json()
    assert data["found"] is True
    for key in ["identity", "scores", "verdict", "ml_predictions",
                "suspicion_reasons", "features", "population_comparison"]:
        assert key in data, f"Missing key: {key}"


def test_api_investigate_account_not_found(api_client):
    """Querying a nonexistent account must return 404."""
    r = api_client.get("/api/investigate/account?query=zzz_definitely_not_real_xyz_999")
    assert r.status_code == 404


def test_api_investigate_account_identity_keys(api_client):
    """Identity object must contain required profile fields."""
    list_r = api_client.get("/api/investigate/accounts?page_size=1")
    screen_name = list_r.json()["accounts"][0].get("screen_name", "")
    r = api_client.get(f"/api/investigate/account?query={screen_name}")
    identity = r.json()["identity"]
    for key in ["user_id", "screen_name", "label", "followers", "following"]:
        assert key in identity, f"Identity missing: {key}"


def test_api_investigate_account_scores_range(api_client):
    """Scores must be in expected ranges."""
    list_r = api_client.get("/api/investigate/accounts?page_size=1")
    screen_name = list_r.json()["accounts"][0].get("screen_name", "")
    r = api_client.get(f"/api/investigate/account?query={screen_name}")
    scores = r.json()["scores"]
    assert 0 <= scores["suspicion_score"] <= 100
    assert 0 <= scores["activity_score"]  <= 100
    assert 0 <= scores["avg_bot_prob"]    <= 1.0


def test_api_investigate_account_verdict_valid(api_client):
    """Verdict must be one of three expected strings."""
    list_r = api_client.get("/api/investigate/accounts?page_size=1")
    screen_name = list_r.json()["accounts"][0].get("screen_name", "")
    r = api_client.get(f"/api/investigate/account?query={screen_name}")
    verdict = r.json()["verdict"]
    valid_verdicts = ["HIGH RISK — Likely Bot", "MODERATE RISK — Possibly Bot", "LOW RISK — Likely Human"]
    assert verdict in valid_verdicts, f"Unexpected verdict: {verdict}"


def test_api_investigate_account_comparison_closer_to(api_client):
    """Each population comparison entry must have closer_to as 'bot' or 'human'."""
    list_r = api_client.get("/api/investigate/accounts?page_size=1")
    screen_name = list_r.json()["accounts"][0].get("screen_name", "")
    r = api_client.get(f"/api/investigate/account?query={screen_name}")
    comparison = r.json()["population_comparison"]
    for entry in comparison:
        assert entry["closer_to"] in ("bot", "human")


# ─────────────────────────────────────────────
# Phase 7: Search
# ─────────────────────────────────────────────

def test_api_investigate_search_returns_list(api_client):
    """Search must always return a list."""
    r = api_client.get("/api/investigate/search?q=a")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_api_investigate_search_respects_n(api_client):
    """Search must respect the n parameter."""
    r = api_client.get("/api/investigate/search?q=b&n=3")
    assert r.status_code == 200
    assert len(r.json()) <= 3


def test_api_investigate_search_empty_query(api_client):
    """Empty search query must return empty list."""
    r = api_client.get("/api/investigate/search?q=")
    assert r.status_code == 200
    assert r.json() == []


# ─────────────────────────────────────────────
# Verdict Logic Unit Tests
# ─────────────────────────────────────────────

def test_verdict_high_risk(patched_env):
    """Suspicion >= 60 must produce HIGH RISK verdict."""
    from account_investigation import _suspicion_reasons
    import pandas as pd
    row = pd.Series({
        "has_default_profile": True,
        "has_default_image":   True,
        "has_description":     False,
        "ff_ratio":            50.0,
        "tweets_per_day":      200.0,
        "account_age_days":    20,
        "has_tweets":          False,
    })
    reasons = _suspicion_reasons(row)
    total_weight = sum(r["weight"] for r in reasons)
    assert total_weight >= 60, f"Expected >= 60 suspicion weight, got {total_weight}"


def test_verdict_low_risk():
    """Low-risk account should have no suspicion reasons."""
    from account_investigation import _suspicion_reasons
    import pandas as pd
    row = pd.Series({
        "has_default_profile": False,
        "has_default_image":   False,
        "has_description":     True,
        "ff_ratio":            1.5,
        "tweets_per_day":      2.0,
        "account_age_days":    1500,
        "has_tweets":          True,
    })
    reasons = _suspicion_reasons(row)
    assert len(reasons) == 0, f"Expected no suspicion reasons, got {reasons}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
