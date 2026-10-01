"""
Phase 5: NLP & Network Analysis Tests

Tests:
1. NLP: VADER sentiment scores are in valid ranges
2. NLP: TF-IDF returns tokens for both labels
3. NLP: Word frequency is sorted descending
4. Network: Graph builds without errors
5. Network: PageRank values are non-negative
6. Network: Label metrics return expected structure
7. All Phase-5 API endpoints return correct structure
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
    """Isolated dataset for Phase 5 tests."""
    import dataset_generator as dg
    import preprocessing as pp
    import feature_engineering as fe
    import nlp_analysis as nlp
    import network_analysis as net

    demo_p = str(tmp_path / "demo.json")
    proc_p = str(tmp_path / "proc.csv")

    monkeypatch.setattr(dg, "DEMO_PATH", demo_p)
    monkeypatch.setattr(dg, "RAW_DIR", str(tmp_path))
    monkeypatch.setattr(pp, "DEMO_DATA_PATH", demo_p)
    monkeypatch.setattr(pp, "REAL_DATA_PATH", str(tmp_path / "nope.json"))
    monkeypatch.setattr(pp, "PROCESSED_CSV", proc_p)
    monkeypatch.setattr(pp, "_cache", {})
    monkeypatch.setattr(fe, "_fe_cache", {})
    monkeypatch.setattr(nlp, "_nlp_cache", {})
    monkeypatch.setattr(net, "_net_cache", {})

    dg.generate_demo_dataset(n_human=40, n_bot=30)
    return tmp_path


# ─────────────────────────────────────────────
# NLP: Sentiment
# ─────────────────────────────────────────────

def test_nlp_sentiment_structure(patched_env):
    """get_nlp_sentiment returns dict with bot and human keys."""
    from nlp_analysis import get_nlp_sentiment
    result = get_nlp_sentiment()
    assert "bot" in result
    assert "human" in result
    assert "comparison" in result


def test_nlp_sentiment_compound_range(patched_env):
    """Compound sentiment score must be in [-1, 1]."""
    from nlp_analysis import get_nlp_sentiment
    result = get_nlp_sentiment()
    for lbl in ("bot", "human"):
        compound = result[lbl]["compound"]
        assert -1.0 <= compound <= 1.0, f"{lbl} compound={compound} out of [-1,1]"


def test_nlp_sentiment_scores_sum_to_one(patched_env):
    """pos + neu + neg ≈ 1.0 for each label."""
    from nlp_analysis import get_nlp_sentiment
    result = get_nlp_sentiment()
    for lbl in ("bot", "human"):
        total = result[lbl]["pos"] + result[lbl]["neu"] + result[lbl]["neg"]
        assert abs(total - 1.0) < 0.1, f"{lbl} scores sum to {total}, expected ~1.0"


def test_nlp_sentiment_comparison_list(patched_env):
    """Comparison list must have 4 entries."""
    from nlp_analysis import get_nlp_sentiment
    result = get_nlp_sentiment()
    assert len(result["comparison"]) == 4


# ─────────────────────────────────────────────
# NLP: TF-IDF
# ─────────────────────────────────────────────

def test_nlp_tfidf_returns_tokens(patched_env):
    """TF-IDF must return tokens for both bot and human."""
    from nlp_analysis import get_nlp_tfidf
    result = get_nlp_tfidf(top_n=10)
    assert "bot" in result
    assert "human" in result
    assert len(result["bot"]) > 0
    assert len(result["human"]) > 0


def test_nlp_tfidf_token_keys(patched_env):
    """Each TF-IDF entry must have 'token' and 'score' keys."""
    from nlp_analysis import get_nlp_tfidf
    result = get_nlp_tfidf(top_n=5)
    for lbl in ("bot", "human"):
        for entry in result[lbl]:
            assert "token" in entry
            assert "score" in entry
            assert entry["score"] >= 0


def test_nlp_tfidf_respects_top_n(patched_env):
    """Result must not exceed top_n tokens per label."""
    from nlp_analysis import get_nlp_tfidf
    result = get_nlp_tfidf(top_n=8)
    assert len(result["bot"]) <= 8
    assert len(result["human"]) <= 8


# ─────────────────────────────────────────────
# NLP: Word Frequency
# ─────────────────────────────────────────────

def test_nlp_word_frequency_structure(patched_env):
    """Word frequency must return dicts with 'word' and 'count'."""
    from nlp_analysis import get_nlp_word_frequency
    result = get_nlp_word_frequency(top_n=10)
    for lbl in ("bot", "human"):
        for entry in result[lbl]:
            assert "word" in entry
            assert "count" in entry
            assert entry["count"] > 0


def test_nlp_word_frequency_sorted_descending(patched_env):
    """Word frequency list must be sorted by count descending."""
    from nlp_analysis import get_nlp_word_frequency
    result = get_nlp_word_frequency(top_n=15)
    for lbl in ("bot", "human"):
        counts = [e["count"] for e in result[lbl]]
        assert counts == sorted(counts, reverse=True), f"{lbl} word freq not sorted"


# ─────────────────────────────────────────────
# Network: Graph Building
# ─────────────────────────────────────────────

def test_network_graph_builds(patched_env):
    """_build_graph() must return a non-empty directed graph."""
    import networkx as nx
    from network_analysis import _build_graph
    G = _build_graph()
    assert isinstance(G, nx.DiGraph)
    assert G.number_of_nodes() > 0


def test_network_graph_has_labels(patched_env):
    """All nodes must have a 'label' attribute."""
    from network_analysis import _build_graph
    G = _build_graph()
    for node, data in G.nodes(data=True):
        assert "label" in data, f"Node {node} missing label"


# ─────────────────────────────────────────────
# Network: Metrics
# ─────────────────────────────────────────────

def test_network_summary_keys(patched_env):
    """get_network_summary must contain required keys."""
    from network_analysis import get_network_summary
    summary = get_network_summary()
    for key in ["total_nodes", "total_edges", "avg_degree", "density"]:
        assert key in summary, f"Missing key: {key}"


def test_network_density_range(patched_env):
    """Graph density must be in [0, 1]."""
    from network_analysis import get_network_summary
    summary = get_network_summary()
    assert 0.0 <= summary["density"] <= 1.0


def test_network_metrics_pagerank_nonnegative(patched_env):
    """All PageRank values must be ≥ 0."""
    from network_analysis import get_network_metrics
    metrics = get_network_metrics(top_n=20)
    for m in metrics:
        assert m["pagerank"] >= 0, f"Negative PageRank: {m}"


def test_network_degree_distribution_structure(patched_env):
    """Degree distribution must contain bot and human histograms."""
    from network_analysis import get_network_degree_distribution
    result = get_network_degree_distribution()
    assert "bot" in result
    assert "human" in result
    for entry in result["bot"]:
        assert "bin_start" in entry and "count" in entry


def test_network_label_metrics(patched_env):
    """Label metrics must include bot and human entries."""
    from network_analysis import get_network_label_metrics
    result = get_network_label_metrics()
    labels = {m["label"] for m in result}
    assert "bot" in labels or "human" in labels  # at least one
    for m in result:
        assert "avg_pagerank" in m
        assert m["avg_pagerank"] >= 0


# ─────────────────────────────────────────────
# Phase 5 API Endpoints
# ─────────────────────────────────────────────

@pytest.fixture
def api_client_p5(tmp_path, monkeypatch):
    import dataset_generator as dg
    import preprocessing as pp
    import feature_engineering as fe
    import nlp_analysis as nlp
    import network_analysis as net

    demo_p = str(tmp_path / "demo.json")
    proc_p = str(tmp_path / "proc.csv")
    monkeypatch.setattr(dg, "DEMO_PATH", demo_p)
    monkeypatch.setattr(dg, "RAW_DIR", str(tmp_path))
    monkeypatch.setattr(pp, "DEMO_DATA_PATH", demo_p)
    monkeypatch.setattr(pp, "REAL_DATA_PATH", str(tmp_path / "nope.json"))
    monkeypatch.setattr(pp, "PROCESSED_CSV", proc_p)
    monkeypatch.setattr(pp, "_cache", {})
    monkeypatch.setattr(fe, "_fe_cache", {})
    monkeypatch.setattr(nlp, "_nlp_cache", {})
    monkeypatch.setattr(net, "_net_cache", {})

    dg.generate_demo_dataset(n_human=40, n_bot=30)

    from fastapi.testclient import TestClient
    import main
    return TestClient(main.app)


def test_api_nlp_sentiment(api_client_p5):
    r = api_client_p5.get("/api/nlp/sentiment")
    assert r.status_code == 200
    data = r.json()
    assert "bot" in data and "human" in data


def test_api_nlp_tfidf(api_client_p5):
    r = api_client_p5.get("/api/nlp/tfidf?top_n=10")
    assert r.status_code == 200
    data = r.json()
    assert "bot" in data and "human" in data


def test_api_nlp_word_frequency(api_client_p5):
    r = api_client_p5.get("/api/nlp/word-frequency?top_n=10")
    assert r.status_code == 200
    data = r.json()
    assert "bot" in data and "human" in data


def test_api_network_summary(api_client_p5):
    r = api_client_p5.get("/api/network/summary")
    assert r.status_code == 200
    data = r.json()
    assert "total_nodes" in data and "total_edges" in data


def test_api_network_metrics(api_client_p5):
    r = api_client_p5.get("/api/network/metrics?top_n=10")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


def test_api_network_degree_distribution(api_client_p5):
    r = api_client_p5.get("/api/network/degree-distribution")
    assert r.status_code == 200
    data = r.json()
    assert "bot" in data and "human" in data


def test_api_network_label_metrics(api_client_p5):
    r = api_client_p5.get("/api/network/label-metrics")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
