"""
Bot-Like Behaviour Detection — Machine Learning Pipeline
Phase 4: ML Pipeline

Trains Logistic Regression, Decision Tree, and Random Forest classifiers on
the Phase-3 engineered features, computes classification metrics with 5-fold
cross-validation, and exposes API-ready response builders.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold, train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve
)
from sklearn.preprocessing import label_binarize
from feature_engineering import get_engineered_df

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "..", "results", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURE_COLS = [
    "ff_ratio", "tweets_per_day", "favourites_per_day", "listed_per_follower",
    "activity_score", "suspicion_score",
    "followers_count", "friends_count", "statuses_count", "favourites_count",
    "description_length", "account_age_days",
    "has_description", "has_default_profile", "has_default_image",
]

MODELS_CONFIG = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
    "Decision Tree":       DecisionTreeClassifier(max_depth=8, random_state=42),
    "Random Forest":       RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
}

# ─────────────────────────────────────────────────────────────────────────────
# Data prep
# ─────────────────────────────────────────────────────────────────────────────
def _prepare_data():
    """Return (X, y, feature_names) from engineered DataFrame."""
    df = get_engineered_df()
    labeled = df[df["label"].isin(["bot", "human"])].copy()

    # Boolean → int
    for col in ["has_description", "has_default_profile", "has_default_image"]:
        if col in labeled.columns:
            labeled[col] = labeled[col].astype(int)

    feat_cols = [c for c in FEATURE_COLS if c in labeled.columns]
    X = labeled[feat_cols].fillna(0).values.astype(float)
    y = (labeled["label"] == "bot").astype(int).values

    return X, y, feat_cols


# ─────────────────────────────────────────────────────────────────────────────
# Training cache
# ─────────────────────────────────────────────────────────────────────────────
_ml_cache: dict = {}


def _train_all_models(force: bool = False):
    """Train all three models (uses cache to avoid retraining on every request)."""
    if "results" in _ml_cache and not force:
        return _ml_cache["results"]

    X, y, feat_cols = _prepare_data()

    # Stratified split for hold-out evaluation
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    results = {}

    for name, clf in MODELS_CONFIG.items():
        # Cross-validation
        cv_acc  = cross_val_score(clf, X_train, y_train, cv=skf, scoring="accuracy")
        cv_f1   = cross_val_score(clf, X_train, y_train, cv=skf, scoring="f1")
        cv_roc  = cross_val_score(clf, X_train, y_train, cv=skf, scoring="roc_auc")

        # Final fit on full train set
        clf.fit(X_train, y_train)
        y_pred  = clf.predict(X_test)
        y_prob  = clf.predict_proba(X_test)[:, 1] if hasattr(clf, "predict_proba") else y_pred

        # Hold-out metrics
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        cm          = confusion_matrix(y_test, y_pred).tolist()

        # Feature importance
        if hasattr(clf, "feature_importances_"):
            importances = clf.feature_importances_.tolist()
        elif hasattr(clf, "coef_"):
            importances = np.abs(clf.coef_[0]).tolist()
        else:
            importances = [0.0] * len(feat_cols)

        results[name] = {
            "model":           name,
            "cv_accuracy":     round(float(cv_acc.mean()), 4),
            "cv_accuracy_std": round(float(cv_acc.std()),  4),
            "cv_f1":           round(float(cv_f1.mean()),  4),
            "cv_f1_std":       round(float(cv_f1.std()),   4),
            "cv_roc_auc":      round(float(cv_roc.mean()), 4),
            "cv_roc_auc_std":  round(float(cv_roc.std()),  4),
            "test_accuracy":   round(float(accuracy_score(y_test, y_pred)),                           4),
            "test_precision":  round(float(precision_score(y_test, y_pred, zero_division=0)),         4),
            "test_recall":     round(float(recall_score(y_test, y_pred, zero_division=0)),            4),
            "test_f1":         round(float(f1_score(y_test, y_pred, zero_division=0)),                4),
            "test_roc_auc":    round(float(roc_auc_score(y_test, y_prob)),                            4),
            "confusion_matrix": cm,
            "roc_curve": {
                "fpr": [round(float(v), 4) for v in fpr.tolist()[::max(1, len(fpr)//100)]],
                "tpr": [round(float(v), 4) for v in tpr.tolist()[::max(1, len(tpr)//100)]],
            },
            "feature_importance": [
                {"feature": feat_cols[i], "importance": round(importances[i], 6)}
                for i in range(len(feat_cols))
            ],
        }

        # Persist model
        model_path = os.path.join(MODELS_DIR, f"{name.lower().replace(' ', '_')}.pkl")
        joblib.dump(clf, model_path)

    _ml_cache["results"]   = results
    _ml_cache["feat_cols"] = feat_cols
    return results


def invalidate_ml_cache():
    _ml_cache.clear()


# ─────────────────────────────────────────────────────────────────────────────
# API Response builders
# ─────────────────────────────────────────────────────────────────────────────

def get_ml_status() -> dict:
    """Returns whether models have been trained and which models exist."""
    trained = []
    for name in MODELS_CONFIG:
        path = os.path.join(MODELS_DIR, f"{name.lower().replace(' ', '_')}.pkl")
        if os.path.exists(path):
            trained.append(name)
    return {
        "trained": len(trained) > 0,
        "trained_models": trained,
        "all_models": list(MODELS_CONFIG.keys()),
    }


def get_ml_train() -> dict:
    """Train all models (or return cached results)."""
    results = _train_all_models()
    summary = []
    for name, r in results.items():
        summary.append({
            "model":         r["model"],
            "cv_accuracy":   r["cv_accuracy"],
            "cv_f1":         r["cv_f1"],
            "cv_roc_auc":    r["cv_roc_auc"],
            "test_accuracy": r["test_accuracy"],
            "test_f1":       r["test_f1"],
            "test_roc_auc":  r["test_roc_auc"],
        })
    return {"status": "ok", "models_trained": len(summary), "summary": summary}


def get_ml_metrics() -> list:
    """Detailed per-model metrics (CV + hold-out)."""
    results = _train_all_models()
    out = []
    for r in results.values():
        out.append({k: v for k, v in r.items()
                    if k not in ("confusion_matrix", "roc_curve", "feature_importance")})
    return out


def get_ml_feature_importance(model_name: str = "Random Forest") -> list:
    """Feature importances for a given model."""
    results = _train_all_models()
    # Case-insensitive lookup
    for name, r in results.items():
        if name.lower() == model_name.lower():
            return sorted(r["feature_importance"], key=lambda x: x["importance"], reverse=True)
    # Default to RF
    return sorted(
        list(results.values())[0]["feature_importance"],
        key=lambda x: x["importance"], reverse=True
    )


def get_ml_confusion_matrix(model_name: str = "Random Forest") -> dict:
    """Confusion matrix for a given model."""
    results = _train_all_models()
    for name, r in results.items():
        if name.lower() == model_name.lower():
            return {"model": name, "confusion_matrix": r["confusion_matrix"],
                    "labels": ["Human (0)", "Bot (1)"]}
    return {"model": model_name, "confusion_matrix": [[0, 0], [0, 0]], "labels": ["Human", "Bot"]}


def get_ml_roc(model_name: str = "Random Forest") -> dict:
    """ROC curve data for a given model."""
    results = _train_all_models()
    for name, r in results.items():
        if name.lower() == model_name.lower():
            return {"model": name, "roc_auc": r["test_roc_auc"], **r["roc_curve"]}
    return {"model": model_name, "roc_auc": 0.5, "fpr": [0, 1], "tpr": [0, 1]}


def get_ml_all_roc() -> list:
    """ROC curve data for all models (for overlay chart)."""
    results = _train_all_models()
    out = []
    for name, r in results.items():
        out.append({
            "model":   name,
            "roc_auc": r["test_roc_auc"],
            "fpr":     r["roc_curve"]["fpr"],
            "tpr":     r["roc_curve"]["tpr"],
        })
    return out
