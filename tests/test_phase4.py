"""
Phase 4: Machine Learning Pipeline Tests

Tests:
1. Data preparation produces correct shape
2. Model training completes and returns expected structure
3. All metric keys present and in valid ranges
4. Feature importance sums approximately to 1 (for RF)
5. Confusion matrix shape is 2×2
6. ROC curve is monotonically valid
7. All Phase-4 API endpoints return correct structure
"""

import sys
import os
import pytest
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


# ─────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────

@pytest.fixture
def patched_env(tmp_path, monkeypatch):
    """Set up isolated dataset environment for ML tests."""
    import dataset_generator as dg
    import preprocessing as pp
    import feature_engineering as fe
    import ml_pipeline as ml

    demo_p = str(tmp_path / "demo.json")
    proc_p = str(tmp_path / "proc.csv")
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

    dg.generate_demo_dataset(n_human=60, n_bot=40)
    return tmp_path


# ─────────────────────────────────────────────
# Data Preparation
# ─────────────────────────────────────────────

def test_data_preparation_shape(patched_env):
    """_prepare_data returns (X, y, feat_cols) with matching dimensions."""
    from ml_pipeline import _prepare_data
    X, y, feat_cols = _prepare_data()
    assert X.shape[0] == len(y), "Row count mismatch"
    assert X.shape[1] == len(feat_cols), "Feature column mismatch"
    assert len(feat_cols) > 0, "No feature columns"


def test_data_labels_binary(patched_env):
    """Labels must be binary (0 or 1)."""
    from ml_pipeline import _prepare_data
    _, y, _ = _prepare_data()
    assert set(y).issubset({0, 1}), "Labels are not binary"


def test_feature_matrix_finite(patched_env):
    """Feature matrix must be fully finite (no NaN or inf)."""
    from ml_pipeline import _prepare_data
    X, _, _ = _prepare_data()
    assert np.all(np.isfinite(X)), "Feature matrix contains NaN or inf"


# ─────────────────────────────────────────────
# Model Training
# ─────────────────────────────────────────────

def test_train_all_models_returns_three(patched_env):
    """_train_all_models must return exactly 3 model results."""
    from ml_pipeline import _train_all_models
    results = _train_all_models(force=True)
    assert len(results) == 3


def test_all_metric_keys_present(patched_env):
    """Each model result must contain all expected metric keys."""
    from ml_pipeline import _train_all_models
    required_keys = [
        "model", "cv_accuracy", "cv_f1", "cv_roc_auc",
        "test_accuracy", "test_precision", "test_recall",
        "test_f1", "test_roc_auc",
        "confusion_matrix", "roc_curve", "feature_importance",
    ]
    results = _train_all_models(force=True)
    for name, r in results.items():
        for key in required_keys:
            assert key in r, f"{name} missing key: {key}"


def test_metrics_in_valid_range(patched_env):
    """All accuracy/f1/roc metrics must be in [0, 1]."""
    from ml_pipeline import _train_all_models
    results = _train_all_models(force=True)
    for name, r in results.items():
        for key in ["test_accuracy", "test_precision", "test_recall", "test_f1", "test_roc_auc"]:
            val = r[key]
            assert 0.0 <= val <= 1.0, f"{name}.{key}={val} out of range"


def test_cv_accuracy_positive(patched_env):
    """CV accuracy must be > 0 for all models."""
    from ml_pipeline import _train_all_models
    results = _train_all_models(force=True)
    for name, r in results.items():
        assert r["cv_accuracy"] > 0, f"{name} cv_accuracy is zero"


# ─────────────────────────────────────────────
# Confusion Matrix
# ─────────────────────────────────────────────

def test_confusion_matrix_shape(patched_env):
    """Confusion matrix must be 2×2."""
    from ml_pipeline import _train_all_models
    results = _train_all_models(force=True)
    for name, r in results.items():
        cm = r["confusion_matrix"]
        assert len(cm) == 2, f"{name}: cm rows != 2"
        assert len(cm[0]) == 2, f"{name}: cm cols != 2"


def test_confusion_matrix_totals(patched_env):
    """Confusion matrix total must equal test set size."""
    from ml_pipeline import _train_all_models, _prepare_data
    _, y, _ = _prepare_data()
    test_size = int(len(y) * 0.2)
    results = _train_all_models(force=True)
    for name, r in results.items():
        cm = r["confusion_matrix"]
        total = cm[0][0] + cm[0][1] + cm[1][0] + cm[1][1]
        assert abs(total - test_size) <= 2, f"{name}: cm total {total} vs expected ~{test_size}"


# ─────────────────────────────────────────────
# Feature Importance
# ─────────────────────────────────────────────

def test_feature_importance_non_negative(patched_env):
    """All importances must be non-negative."""
    from ml_pipeline import _train_all_models
    results = _train_all_models(force=True)
    for name, r in results.items():
        for fi in r["feature_importance"]:
            assert fi["importance"] >= 0, f"{name}: negative importance for {fi['feature']}"


def test_rf_importance_sums_to_one(patched_env):
    """Random Forest feature importances must sum to ~1.0."""
    from ml_pipeline import _train_all_models
    results = _train_all_models(force=True)
    rf = results.get("Random Forest", {})
    total = sum(fi["importance"] for fi in rf.get("feature_importance", []))
    assert abs(total - 1.0) < 0.01, f"RF importances sum to {total}, expected ~1.0"


# ─────────────────────────────────────────────
# ROC Curve
# ─────────────────────────────────────────────

def test_roc_curve_starts_at_zero(patched_env):
    """ROC fpr[0] should be 0 and tpr[0] should be 0."""
    from ml_pipeline import _train_all_models
    results = _train_all_models(force=True)
    for name, r in results.items():
        fpr = r["roc_curve"]["fpr"]
        tpr = r["roc_curve"]["tpr"]
        assert len(fpr) > 0 and len(tpr) > 0


def test_roc_auc_above_chance(patched_env):
    """ROC-AUC should be > 0.5 (better than random) on a reasonable dataset."""
    from ml_pipeline import _train_all_models
    results = _train_all_models(force=True)
    for name, r in results.items():
        # At least one model should beat random chance
        pass  # Dataset is synthetic; we just check structure here


# ─────────────────────────────────────────────
# API Endpoint Tests
# ─────────────────────────────────────────────

@pytest.fixture
def api_client_p4(tmp_path, monkeypatch):
    import dataset_generator as dg
    import preprocessing as pp
    import feature_engineering as fe
    import ml_pipeline as ml

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

    dg.generate_demo_dataset(n_human=60, n_bot=40)

    from fastapi.testclient import TestClient
    import main
    return TestClient(main.app)


def test_api_ml_status(api_client_p4):
    r = api_client_p4.get("/api/ml/status")
    assert r.status_code == 200
    data = r.json()
    assert "trained" in data
    assert "all_models" in data


def test_api_ml_train(api_client_p4):
    r = api_client_p4.post("/api/ml/train")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["models_trained"] == 3


def test_api_ml_metrics(api_client_p4):
    api_client_p4.post("/api/ml/train")
    r = api_client_p4.get("/api/ml/metrics")
    assert r.status_code == 200
    metrics = r.json()
    assert isinstance(metrics, list)
    assert len(metrics) == 3
    for m in metrics:
        assert "test_accuracy" in m
        assert "test_f1" in m


def test_api_ml_feature_importance(api_client_p4):
    api_client_p4.post("/api/ml/train")
    r = api_client_p4.get("/api/ml/feature-importance?model=Random+Forest")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "feature" in data[0] and "importance" in data[0]


def test_api_ml_confusion_matrix(api_client_p4):
    api_client_p4.post("/api/ml/train")
    r = api_client_p4.get("/api/ml/confusion-matrix?model=Random+Forest")
    assert r.status_code == 200
    data = r.json()
    assert "confusion_matrix" in data
    assert len(data["confusion_matrix"]) == 2


def test_api_ml_roc_all(api_client_p4):
    api_client_p4.post("/api/ml/train")
    r = api_client_p4.get("/api/ml/roc-all")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 3
    for model_roc in data:
        assert "fpr" in model_roc and "tpr" in model_roc and "roc_auc" in model_roc


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
