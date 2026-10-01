"""
Bot-Like Behaviour Detection — Feature Engineering & Behaviour Analytics
Phase 3: Feature Engineering & Behaviour Analytics

Derives a rich feature set from the preprocessed TwiBot-20 data and
provides statistical behaviour-comparison functions (bot vs human).
"""

import json
import numpy as np
import pandas as pd
from preprocessing import get_or_load

# ─────────────────────────────────────────────────────────────────────────────
# Feature Engineering — derives all Phase-3 features from the preprocessed df
# ─────────────────────────────────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute all Phase-3 derived features and append them to *df*.
    Operates on a copy — the original is not mutated.
    """
    df = df.copy()

    fc  = df["friends_count"].fillna(0)
    fl  = df["followers_count"].fillna(0)
    sc  = df["statuses_count"].fillna(0)
    fav = df["favourites_count"].fillna(0)
    lc  = df["listed_count"].fillna(0)
    age = df.get("account_age_days", pd.Series(np.zeros(len(df)), index=df.index)).fillna(0)
    desc_len = df.get("description_length", pd.Series(np.zeros(len(df)), index=df.index)).fillna(0)

    # ── Ratio features ────────────────────────────────────────────────────────
    df["ff_ratio"]            = np.where(fc > 0, fl / fc, fl).round(4)
    df["tweets_per_day"]      = np.where(age > 0, sc / age, sc).round(4)
    df["favourites_per_day"]  = np.where(age > 0, fav / age, fav).round(4)
    df["listed_per_follower"] = np.where(fl > 0, lc / fl, lc).round(6)

    # ── Boolean / categorical indicators ──────────────────────────────────────
    df["has_description"]     = desc_len > 0
    df["has_default_profile"] = df.get("default_profile",       pd.Series(False, index=df.index)).fillna(False).astype(bool)
    df["has_default_image"]   = df.get("default_profile_image", pd.Series(False, index=df.index)).fillna(False).astype(bool)

    # ── Activity score (0-100 composite) ──────────────────────────────────────
    norm_tweets = np.clip(df["tweets_per_day"] / 50, 0, 1)
    norm_fav    = np.clip(df["favourites_per_day"] / 30, 0, 1)
    norm_fl     = np.clip(fl / 1000, 0, 1)
    df["activity_score"] = ((norm_tweets * 0.4 + norm_fav * 0.3 + norm_fl * 0.3) * 100).round(2)

    # ── Suspicion score (0-100 composite, higher → more bot-like) ────────────
    sus = np.zeros(len(df))
    sus += df["has_default_profile"].astype(float) * 15
    sus += df["has_default_image"].astype(float) * 15
    sus += (~df["has_description"]).astype(float) * 15
    sus += np.clip((df["ff_ratio"].fillna(1) > 20).astype(float) * 20, 0, 20)
    sus += np.clip((df["tweets_per_day"].fillna(0) > 100).astype(float) * 15, 0, 15)
    sus += np.clip((age < 90).astype(float) * 10, 0, 10)
    sus += (~df.get("has_tweets", pd.Series(True, index=df.index)).fillna(True)).astype(float) * 10
    df["suspicion_score"] = np.clip(sus, 0, 100).round(2)

    # ── Account tier (bucketed follower range) ─────────────────────────────────
    def _tier(n):
        if n < 100:     return "Nano"
        if n < 1_000:   return "Micro"
        if n < 10_000:  return "Mid"
        if n < 100_000: return "Macro"
        return "Mega"

    df["account_tier"] = fl.apply(_tier)

    return df


# ─────────────────────────────────────────────────────────────────────────────
# Helper — load + engineer
# ─────────────────────────────────────────────────────────────────────────────
_fe_cache: dict = {}


def get_engineered_df() -> pd.DataFrame:
    """Return (and cache) the fully-engineered feature DataFrame."""
    if "df" not in _fe_cache:
        df, _ = get_or_load()
        _fe_cache["df"] = engineer_features(df)
    return _fe_cache["df"]


def invalidate_cache():
    _fe_cache.clear()


# ─────────────────────────────────────────────────────────────────────────────
# API Response builders
# ─────────────────────────────────────────────────────────────────────────────

def _safe_mean(series):
    return round(float(series.mean()), 4) if len(series) else 0.0

def _safe_median(series):
    return round(float(series.median()), 4) if len(series) else 0.0

def _percentile(series, q):
    arr = series.dropna()
    return round(float(np.percentile(arr, q)), 4) if len(arr) else 0.0


def get_feature_summary() -> dict:
    """Returns the list of all engineered features with descriptions."""
    features = [
        {"feature": "ff_ratio",            "description": "Followers / Following ratio",                      "category": "Ratio"},
        {"feature": "tweets_per_day",       "description": "Statuses count / account age in days",             "category": "Activity"},
        {"feature": "favourites_per_day",   "description": "Favourites count / account age in days",           "category": "Activity"},
        {"feature": "listed_per_follower",  "description": "Listed count / followers count",                   "category": "Influence"},
        {"feature": "has_description",      "description": "Profile has a non-empty description",              "category": "Profile"},
        {"feature": "has_default_profile",  "description": "Account still uses default profile theme",         "category": "Profile"},
        {"feature": "has_default_image",    "description": "Account uses default profile image",               "category": "Profile"},
        {"feature": "activity_score",       "description": "Composite activity index (0-100)",                 "category": "Composite"},
        {"feature": "suspicion_score",      "description": "Composite bot-suspicion index (0-100)",            "category": "Composite"},
        {"feature": "account_tier",         "description": "Follower tier: Nano/Micro/Mid/Macro/Mega",         "category": "Profile"},
        {"feature": "description_length",   "description": "Character length of profile description",          "category": "Profile"},
        {"feature": "account_age_days",     "description": "Account age in days from creation to today",       "category": "Temporal"},
        {"feature": "followers_count",      "description": "Number of followers",                              "category": "Network"},
        {"feature": "friends_count",        "description": "Number of accounts followed",                      "category": "Network"},
        {"feature": "statuses_count",       "description": "Total number of tweets posted",                    "category": "Activity"},
        {"feature": "favourites_count",     "description": "Total number of likes given",                      "category": "Activity"},
    ]
    df = get_engineered_df()
    labeled = df[df["label"].isin(["bot", "human"])]
    return {
        "total_features": len(features),
        "labeled_accounts": int(len(labeled)),
        "bot_count":   int((labeled["label"] == "bot").sum()),
        "human_count": int((labeled["label"] == "human").sum()),
        "features": features,
    }


def get_feature_stats() -> list:
    """Per-feature descriptive statistics split by bot / human label."""
    df = get_engineered_df()
    bots   = df[df["label"] == "bot"]
    humans = df[df["label"] == "human"]

    numeric_features = [
        "ff_ratio", "tweets_per_day", "favourites_per_day",
        "listed_per_follower", "activity_score", "suspicion_score",
        "description_length", "account_age_days",
        "followers_count", "friends_count", "statuses_count", "favourites_count",
    ]

    result = []
    for feat in numeric_features:
        if feat not in df.columns:
            continue
        b_vals = bots[feat].dropna()
        h_vals = humans[feat].dropna()
        result.append({
            "feature":      feat,
            "bot_mean":     _safe_mean(b_vals),
            "human_mean":   _safe_mean(h_vals),
            "bot_median":   _safe_median(b_vals),
            "human_median": _safe_median(h_vals),
            "bot_p25":      _percentile(b_vals, 25),
            "bot_p75":      _percentile(b_vals, 75),
            "human_p25":    _percentile(h_vals, 25),
            "human_p75":    _percentile(h_vals, 75),
            "bot_std":      round(float(b_vals.std()), 4) if len(b_vals) > 1 else 0.0,
            "human_std":    round(float(h_vals.std()), 4) if len(h_vals) > 1 else 0.0,
            "bot_n":        int(len(b_vals)),
            "human_n":      int(len(h_vals)),
        })
    return result


def get_behaviour_comparison() -> dict:
    """Bot vs human comparison across key behavioural dimensions (chart-ready)."""
    df = get_engineered_df()
    bots   = df[df["label"] == "bot"]
    humans = df[df["label"] == "human"]

    def entry(label, feat, fmt="number"):
        b = _safe_mean(bots[feat].dropna())   if feat in bots.columns   else 0
        h = _safe_mean(humans[feat].dropna()) if feat in humans.columns else 0
        return {"metric": label, "bot": b, "human": h, "format": fmt}

    return {
        "comparison": [
            entry("Followers",          "followers_count"),
            entry("Following",          "friends_count"),
            entry("Tweets",             "statuses_count"),
            entry("Favourites",         "favourites_count"),
            entry("Tweets/Day",         "tweets_per_day",     "decimal"),
            entry("FF Ratio",           "ff_ratio",           "decimal"),
            entry("Account Age (days)", "account_age_days"),
            entry("Activity Score",     "activity_score",     "decimal"),
            entry("Suspicion Score",    "suspicion_score",    "decimal"),
            entry("Description Length", "description_length"),
        ]
    }


def get_boolean_feature_rates() -> list:
    """Percentage of bots vs humans that have each boolean flag set to True."""
    df = get_engineered_df()
    bots   = df[df["label"] == "bot"]
    humans = df[df["label"] == "human"]

    bool_features = [
        ("Default Profile",  "has_default_profile"),
        ("Default Image",    "has_default_image"),
        ("Has Description",  "has_description"),
        ("Has Tweets",       "has_tweets"),
        ("Has Neighbors",    "has_neighbors"),
        ("Geo Enabled",      "geo_enabled"),
        ("Verified",         "verified"),
    ]

    result = []
    for label, feat in bool_features:
        if feat not in df.columns:
            continue
        b_col = bots[feat].map({True: 1, False: 0, "True": 1, "False": 0}).fillna(0)
        h_col = humans[feat].map({True: 1, False: 0, "True": 1, "False": 0}).fillna(0)
        result.append({
            "feature":   label,
            "bot_pct":   round(float(b_col.mean() * 100), 2) if len(b_col)   else 0.0,
            "human_pct": round(float(h_col.mean() * 100), 2) if len(h_col) else 0.0,
        })
    return result


def get_score_distributions() -> dict:
    """Binned distributions of activity_score and suspicion_score for bots and humans."""
    df = get_engineered_df()

    def _histogram(series, bins=10, range_=(0, 100)):
        counts, edges = np.histogram(series.dropna(), bins=bins, range=range_)
        return [
            {"bin_start": round(float(edges[i]), 1),
             "bin_end":   round(float(edges[i + 1]), 1),
             "count":     int(counts[i])}
            for i in range(len(counts))
        ]

    bots   = df[df["label"] == "bot"]
    humans = df[df["label"] == "human"]
    return {
        "activity_score": {
            "bot":   _histogram(bots["activity_score"]),
            "human": _histogram(humans["activity_score"]),
        },
        "suspicion_score": {
            "bot":   _histogram(bots["suspicion_score"]),
            "human": _histogram(humans["suspicion_score"]),
        },
    }


def get_account_tier_distribution() -> list:
    """Count of accounts per follower tier, split by label."""
    df = get_engineered_df()
    order = ["Nano", "Micro", "Mid", "Macro", "Mega"]
    result = []
    for tier in order:
        tier_df = df[df["account_tier"] == tier]
        result.append({
            "tier":  tier,
            "bot":   int((tier_df["label"] == "bot").sum()),
            "human": int((tier_df["label"] == "human").sum()),
            "total": int(len(tier_df)),
        })
    return result


def get_top_suspicious_accounts(n: int = 20) -> list:
    """Return the top-n most suspicious accounts by suspicion_score."""
    df = get_engineered_df()
    cols = [c for c in [
        "user_id", "screen_name", "name", "label",
        "suspicion_score", "activity_score",
        "followers_count", "friends_count",
        "tweets_per_day", "ff_ratio",
        "has_default_profile", "has_default_image", "has_description"
    ] if c in df.columns]
    top = df.nlargest(n, "suspicion_score")[cols]
    return json.loads(top.to_json(orient="records"))


def get_scatter_data(x_feat: str = "ff_ratio", y_feat: str = "tweets_per_day",
                     max_points: int = 300) -> list:
    """Returns sampled (x, y, label) triples for a scatter plot."""
    df = get_engineered_df()
    valid = {
        "ff_ratio", "tweets_per_day", "favourites_per_day",
        "activity_score", "suspicion_score", "account_age_days",
        "followers_count", "friends_count", "statuses_count",
        "favourites_count", "description_length", "listed_per_follower",
    }
    if x_feat not in valid: x_feat = "ff_ratio"
    if y_feat not in valid: y_feat = "tweets_per_day"

    labeled = df[df["label"].isin(["bot", "human"])].dropna(subset=[x_feat, y_feat])
    x_p99 = float(labeled[x_feat].quantile(0.99))
    y_p99 = float(labeled[y_feat].quantile(0.99))
    labeled = labeled[(labeled[x_feat] <= x_p99) & (labeled[y_feat] <= y_p99)]

    if len(labeled) > max_points:
        labeled = labeled.sample(n=max_points, random_state=42)

    result = []
    for _, row in labeled.iterrows():
        result.append({
            "x":     round(float(row[x_feat]), 4),
            "y":     round(float(row[y_feat]), 4),
            "label": str(row["label"]),
            "name":  str(row.get("screen_name", "")),
        })
    return result
