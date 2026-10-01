"""
Bot-Like Behaviour Detection — Account Investigation
Phase 7: Account Investigation & Final Integration

Provides per-account bot probability prediction using trained ML models,
full feature breakdown, suspicion reasoning, and comparison against the
population average (bot vs human centroids).
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

from feature_engineering import get_engineered_df, engineer_features
from ml_pipeline import MODELS_DIR, FEATURE_COLS, _train_all_models

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _load_best_model():
    """Load the Random Forest model (highest AUC by default)."""
    for name in ["random_forest", "logistic_regression", "decision_tree"]:
        path = os.path.join(MODELS_DIR, f"{name}.pkl")
        if os.path.exists(path):
            return joblib.load(path), name.replace("_", " ").title()
    return None, None


def _get_feature_vector(row: pd.Series, feat_cols: list) -> np.ndarray:
    """Extract a numeric feature vector from a DataFrame row."""
    vec = []
    for col in feat_cols:
        val = row.get(col, 0)
        if isinstance(val, bool):
            val = int(val)
        try:
            vec.append(float(val) if pd.notna(val) else 0.0)
        except (TypeError, ValueError):
            vec.append(0.0)
    return np.array(vec).reshape(1, -1)


def _suspicion_reasons(row: pd.Series) -> list:
    """Generate human-readable reasoning for high suspicion score."""
    reasons = []

    if row.get("has_default_profile", False):
        reasons.append({"flag": "Default Profile Theme", "weight": 15,
                        "detail": "Account never customised its profile theme."})
    if row.get("has_default_image", False):
        reasons.append({"flag": "Default Profile Image", "weight": 15,
                        "detail": "Account uses the default egg/avatar image."})
    if not row.get("has_description", True):
        reasons.append({"flag": "Missing Bio", "weight": 15,
                        "detail": "Profile description is empty."})

    ff = float(row.get("ff_ratio", 1) or 1)
    if ff > 20:
        reasons.append({"flag": "Extreme FF Ratio", "weight": 20,
                        "detail": f"Followers/Following ratio is {ff:.1f} (bots follow many but gain few followers)."})

    tpd = float(row.get("tweets_per_day", 0) or 0)
    if tpd > 100:
        reasons.append({"flag": "Abnormal Tweet Rate", "weight": 15,
                        "detail": f"Tweets per day is {tpd:.1f} — far above typical human behaviour."})

    age = float(row.get("account_age_days", 365) or 365)
    if age < 90:
        reasons.append({"flag": "New Account", "weight": 10,
                        "detail": f"Account is only {int(age)} days old."})

    if not row.get("has_tweets", True):
        reasons.append({"flag": "No Tweet Activity", "weight": 10,
                        "detail": "No tweets found for this account."})

    return sorted(reasons, key=lambda r: r["weight"], reverse=True)


# ─────────────────────────────────────────────────────────────────────────────
# Population centroid cache
# ─────────────────────────────────────────────────────────────────────────────
_centroid_cache: dict = {}


def _get_population_centroids(feat_cols: list) -> dict:
    """Compute bot / human centroid vectors for comparison."""
    if "centroids" in _centroid_cache:
        return _centroid_cache["centroids"]

    df = get_engineered_df()
    bool_cols = ["has_description", "has_default_profile", "has_default_image"]
    for col in bool_cols:
        if col in df.columns:
            df = df.copy()
            df[col] = df[col].astype(int)

    bots   = df[df["label"] == "bot"][feat_cols].fillna(0)
    humans = df[df["label"] == "human"][feat_cols].fillna(0)

    _centroid_cache["centroids"] = {
        "bot":   bots.mean().to_dict(),
        "human": humans.mean().to_dict(),
    }
    return _centroid_cache["centroids"]


def invalidate_investigation_cache():
    _centroid_cache.clear()


# ─────────────────────────────────────────────────────────────────────────────
# Core: look up an account from the dataset
# ─────────────────────────────────────────────────────────────────────────────

def _find_account(query: str) -> pd.Series | None:
    """
    Search the engineered dataframe for a matching account.
    Tries: user_id exact, screen_name prefix (case-insensitive), name prefix.
    Returns the first matching row or None.
    """
    df  = get_engineered_df()
    q   = str(query).strip().lower().lstrip("@")

    # Exact user_id
    if "user_id" in df.columns:
        match = df[df["user_id"].astype(str).str.strip() == q]
        if not match.empty:
            return match.iloc[0]

    # screen_name contains
    if "screen_name" in df.columns:
        match = df[df["screen_name"].astype(str).str.strip().str.lower().str.startswith(q)]
        if not match.empty:
            return match.iloc[0]

    # name contains
    if "name" in df.columns:
        match = df[df["name"].astype(str).str.strip().str.lower().str.contains(q, na=False)]
        if not match.empty:
            return match.iloc[0]

    return None


# ─────────────────────────────────────────────────────────────────────────────
# API Response builders
# ─────────────────────────────────────────────────────────────────────────────

def get_account_list(page: int = 1, page_size: int = 50,
                     label_filter: str = "all", sort_by: str = "suspicion_score") -> dict:
    """
    Paginated list of accounts with key metrics.
    label_filter: 'all' | 'bot' | 'human'
    sort_by: any numeric column name
    """
    df = get_engineered_df()

    if label_filter in ("bot", "human"):
        df = df[df["label"] == label_filter]

    bool_cols = ["has_description", "has_default_profile", "has_default_image"]
    for col in bool_cols:
        if col in df.columns:
            df = df.copy()
            df[col] = df[col].astype(int)

    if sort_by in df.columns:
        df = df.sort_values(sort_by, ascending=False)

    total    = len(df)
    start    = (page - 1) * page_size
    page_df  = df.iloc[start : start + page_size]

    display_cols = [c for c in [
        "user_id", "screen_name", "name", "label",
        "suspicion_score", "activity_score",
        "followers_count", "friends_count",
        "tweets_per_day", "ff_ratio",
        "account_age_days", "description_length",
        "has_default_profile", "has_default_image", "has_description",
    ] if c in page_df.columns]

    return {
        "total":     total,
        "page":      page,
        "page_size": page_size,
        "pages":     max(1, -(-total // page_size)),  # ceiling division
        "accounts":  json.loads(page_df[display_cols].to_json(orient="records")),
    }


def get_account_detail(query: str) -> dict:
    """
    Full investigation report for a single account:
    - Identity info
    - All engineered features
    - ML bot probability (all three models)
    - Suspicion reasoning
    - Population comparison (bot / human centroid deltas)
    - Verdict
    """
    row = _find_account(query)
    if row is None:
        return {"found": False, "query": query}

    # Ensure training happened
    try:
        results = _train_all_models()
        feat_cols = [c for c in FEATURE_COLS if c in row.index]
    except Exception:
        results  = {}
        feat_cols = [c for c in FEATURE_COLS if c in row.index]

    # Boolean coercion for feature vector
    row_copy = row.copy()
    for col in ["has_description", "has_default_profile", "has_default_image"]:
        if col in row_copy.index:
            row_copy[col] = int(bool(row_copy[col]))

    X = _get_feature_vector(row_copy, feat_cols)

    # ML predictions
    ml_predictions = []
    for name in results:
        model_path = os.path.join(MODELS_DIR, f"{name.lower().replace(' ', '_')}.pkl")
        if not os.path.exists(model_path):
            continue
        clf  = joblib.load(model_path)
        prob = float(clf.predict_proba(X)[0][1]) if hasattr(clf, "predict_proba") else float(clf.predict(X)[0])
        ml_predictions.append({
            "model":       name,
            "bot_prob":    round(prob, 4),
            "human_prob":  round(1 - prob, 4),
            "prediction":  "bot" if prob >= 0.5 else "human",
        })

    avg_bot_prob = float(np.mean([p["bot_prob"] for p in ml_predictions])) if ml_predictions else 0.5

    # Feature vector as dict
    features = {col: round(float(row_copy.get(col, 0) or 0), 4) for col in feat_cols}

    # Centroid comparison
    centroids = _get_population_centroids(feat_cols)
    comparison = []
    for col in feat_cols:
        val      = float(row_copy.get(col, 0) or 0)
        bot_avg  = float(centroids["bot"].get(col, 0))
        hum_avg  = float(centroids["human"].get(col, 0))
        comparison.append({
            "feature":    col,
            "account":    round(val, 4),
            "bot_avg":    round(bot_avg, 4),
            "human_avg":  round(hum_avg, 4),
            "closer_to":  "bot" if abs(val - bot_avg) < abs(val - hum_avg) else "human",
        })

    reasons  = _suspicion_reasons(row)
    sus_score = float(row.get("suspicion_score", 0) or 0)
    act_score = float(row.get("activity_score",  0) or 0)

    # Verdict logic
    if avg_bot_prob >= 0.75 or sus_score >= 60:
        verdict = "HIGH RISK — Likely Bot"
        verdict_color = "danger"
    elif avg_bot_prob >= 0.5 or sus_score >= 40:
        verdict = "MODERATE RISK — Possibly Bot"
        verdict_color = "warning"
    else:
        verdict = "LOW RISK — Likely Human"
        verdict_color = "success"

    return {
        "found":          True,
        "query":          query,
        "identity": {
            "user_id":     str(row.get("user_id", "")),
            "screen_name": str(row.get("screen_name", "")),
            "name":        str(row.get("name", "")),
            "label":       str(row.get("label", "unknown")),
            "description": str(row.get("description", "")),
            "followers":   int(row.get("followers_count", 0) or 0),
            "following":   int(row.get("friends_count", 0) or 0),
            "statuses":    int(row.get("statuses_count", 0) or 0),
            "account_age_days": int(row.get("account_age_days", 0) or 0),
            "verified":    bool(row.get("verified", False)),
        },
        "scores": {
            "suspicion_score": round(sus_score, 2),
            "activity_score":  round(act_score, 2),
            "avg_bot_prob":    round(avg_bot_prob, 4),
        },
        "verdict":        verdict,
        "verdict_color":  verdict_color,
        "ml_predictions": ml_predictions,
        "suspicion_reasons": reasons,
        "features":       features,
        "population_comparison": comparison,
    }


def get_search_suggestions(query: str, n: int = 10) -> list:
    """Return up to n account suggestions matching the query string."""
    df = get_engineered_df()
    q  = str(query).strip().lower().lstrip("@")
    if not q:
        return []

    matches = pd.DataFrame()
    if "screen_name" in df.columns:
        matches = df[df["screen_name"].astype(str).str.strip().str.lower().str.contains(q, na=False)]

    if len(matches) < n and "name" in df.columns:
        extra = df[df["name"].astype(str).str.strip().str.lower().str.contains(q, na=False)]
        matches = pd.concat([matches, extra]).drop_duplicates()

    cols = [c for c in ["user_id", "screen_name", "name", "label", "suspicion_score"] if c in matches.columns]
    return json.loads(matches[cols].head(n).to_json(orient="records"))


def get_investigation_stats() -> dict:
    """High-level investigation statistics for the page header."""
    df = get_engineered_df()
    labeled = df[df["label"].isin(["bot", "human"])]
    return {
        "total_accounts":    int(len(df)),
        "labeled_accounts":  int(len(labeled)),
        "bot_count":         int((labeled["label"] == "bot").sum()),
        "human_count":       int((labeled["label"] == "human").sum()),
        "high_risk_count":   int((labeled["suspicion_score"] >= 60).sum()),
        "moderate_risk_count": int(((labeled["suspicion_score"] >= 40) & (labeled["suspicion_score"] < 60)).sum()),
    }
