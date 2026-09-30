"""
Bot-Like Behaviour Detection — Data Preprocessing Module
Phase 2: Data Preprocessing + EDA

Dataset: TwiBot-20 (or demo dataset if real data unavailable)
Format: JSON array of user objects
"""

import json
import os
import pandas as pd
import numpy as np
from datetime import datetime, timezone

# ─────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_DIR  = os.path.join(BASE_DIR, "..", "data")
RAW_DIR   = os.path.join(DATA_DIR, "raw")
PROC_DIR  = os.path.join(DATA_DIR, "processed")

REAL_DATA_PATH  = os.path.join(RAW_DIR, "TwiBot-20_sample.json")   # real full dataset
DEMO_DATA_PATH  = os.path.join(RAW_DIR, "twibot20_demo.json")      # auto-generated demo
PROCESSED_CSV   = os.path.join(PROC_DIR, "twibot20_processed.csv")

os.makedirs(RAW_DIR,  exist_ok=True)
os.makedirs(PROC_DIR, exist_ok=True)

# ─────────────────────────────────────────────
# Profile fields confirmed from TwiBot-20 schema
# ─────────────────────────────────────────────
PROFILE_FIELDS = [
    "id_str", "name", "screen_name",
    "followers_count", "friends_count", "statuses_count",
    "listed_count", "favourites_count",
    "created_at", "verified", "default_profile", "default_profile_image",
    "geo_enabled", "description",
]

NUMERIC_COLS = [
    "followers_count", "friends_count", "statuses_count",
    "listed_count", "favourites_count",
    "tweet_sample_count", "neighbor_following_count", "neighbor_follower_count",
]

BOOL_COLS = ["verified", "default_profile", "default_profile_image", "geo_enabled"]


# ─────────────────────────────────────────────
# Dataset file resolver
# ─────────────────────────────────────────────
def _resolve_data_path() -> tuple[str, bool]:
    """
    Returns (filepath, is_real) where is_real=True means the full TwiBot-20
    dataset is available (with labels). Otherwise falls back to the demo dataset.
    """
    # Check if the real TwiBot-20 dataset exists AND has labels
    if os.path.exists(REAL_DATA_PATH):
        with open(REAL_DATA_PATH, "r", encoding="utf-8") as f:
            sample = json.load(f)
        has_labels = any("label" in d for d in sample[:10])
        if has_labels:
            return REAL_DATA_PATH, True

    # Fallback: auto-generate demo data
    if not os.path.exists(DEMO_DATA_PATH):
        from dataset_generator import generate_demo_dataset
        generate_demo_dataset()

    return DEMO_DATA_PATH, False


# ─────────────────────────────────────────────
# JSON → Flat DataFrame
# ─────────────────────────────────────────────
def _strip(v):
    return v.strip() if isinstance(v, str) else v


def _account_age_days(created_at_str: str):
    try:
        dt = datetime.strptime(created_at_str.strip(), "%a %b %d %H:%M:%S +0000 %Y")
        dt = dt.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - dt).days
    except Exception:
        return None


def load_raw_data(filepath: str | None = None) -> tuple[pd.DataFrame, dict]:
    """
    Load TwiBot-20 JSON and flatten to a tidy DataFrame.
    Returns (df, meta) where meta contains dataset source info.
    """
    is_real = False
    if filepath is None:
        filepath, is_real = _resolve_data_path()

    with open(filepath, "r", encoding="utf-8") as f:
        raw = json.load(f)

    records = []
    for entry in raw:
        rec: dict = {}
        rec["user_id"] = str(entry.get("ID", "")).strip()

        profile = entry.get("profile", {}) or {}
        for field in PROFILE_FIELDS:
            rec[field] = _strip(profile.get(field))

        # Label
        label_raw = str(entry.get("label", "")).strip().lower()
        rec["label"] = label_raw if label_raw in {"bot", "human"} else None
        rec["label_int"] = (
            1 if rec["label"] == "bot" else
            0 if rec["label"] == "human" else None
        )

        # Tweets
        tweets = entry.get("tweet") or []
        rec["tweet_sample_count"] = len(tweets)
        rec["has_tweets"] = len(tweets) > 0

        # Neighbors
        neighbor = entry.get("neighbor") or {}
        rec["has_neighbors"] = bool(neighbor)
        rec["neighbor_following_count"] = len((neighbor.get("following") or []))
        rec["neighbor_follower_count"]  = len((neighbor.get("follower")  or []))

        # Domain
        domains = entry.get("domain") or []
        rec["domain"] = ", ".join(d.strip() for d in domains if d)

        records.append(rec)

    df = pd.DataFrame(records)
    meta = {
        "filepath": filepath,
        "is_real_dataset": is_real,
        "data_note": (
            "Full TwiBot-20 dataset (research access required)"
            if is_real else
            "Demo dataset — TwiBot-20 schema, synthetic data for development. "
            "Place the real TwiBot-20 dataset at data/raw/TwiBot-20_sample.json to use real data."
        ),
    }
    return df, meta


# ─────────────────────────────────────────────
# Type Coercion + Feature Engineering
# ─────────────────────────────────────────────
def coerce_types(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    for col in NUMERIC_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    for col in BOOL_COLS:
        if col in df.columns:
            df[col] = df[col].map({"True": True, "False": False, True: True, False: False})

    if "created_at" in df.columns:
        df["account_age_days"] = df["created_at"].apply(
            lambda v: _account_age_days(v) if pd.notna(v) and v.strip() else None
        )

    # Safe derived features
    fc = df["friends_count"].fillna(0)
    fl = df["followers_count"].fillna(0)
    df["followers_following_ratio"] = np.where(fc > 0, fl / fc, fl).round(4)

    age = df["account_age_days"].fillna(0)
    sc  = df["statuses_count"].fillna(0)
    df["tweets_per_day"] = np.where(age > 0, sc / age, sc).round(4)

    df["description_length"] = df["description"].fillna("").apply(len)

    return df


# ─────────────────────────────────────────────
# Full Preprocessing Pipeline
# ─────────────────────────────────────────────
def preprocess(filepath: str | None = None) -> tuple[pd.DataFrame, dict]:
    df, meta = load_raw_data(filepath)
    df = coerce_types(df)
    df.to_csv(PROCESSED_CSV, index=False)
    print(f"Processed dataset saved: {PROCESSED_CSV} ({len(df)} rows)")
    return df, meta


# ─────────────────────────────────────────────
# EDA Summary Functions
# ─────────────────────────────────────────────
def get_dataset_summary(df: pd.DataFrame, meta: dict) -> dict:
    label_counts = df["label"].value_counts().to_dict()
    return {
        "dataset_name": "TwiBot-20 (Demo)" if not meta.get("is_real_dataset") else "TwiBot-20",
        "dataset_source": "https://github.com/BunsenFeng/TwiBot-20",
        "data_note": meta.get("data_note", ""),
        "is_demo": not meta.get("is_real_dataset", False),
        "total_rows": int(len(df)),
        "total_columns": int(len(df.columns)),
        "columns": list(df.columns),
        "bot_count": int(label_counts.get("bot", 0)),
        "human_count": int(label_counts.get("human", 0)),
        "unlabeled_count": int(df["label"].isna().sum()),
        "has_tweet_data": bool(df["has_tweets"].any()),
        "has_network_data": bool(df["has_neighbors"].any()),
    }


def get_column_info(df: pd.DataFrame) -> list[dict]:
    info = []
    for col in df.columns:
        n = int(df[col].isna().sum())
        info.append({
            "column": col,
            "dtype": str(df[col].dtype),
            "null_count": n,
            "null_pct": round(n / len(df) * 100, 2) if len(df) else 0.0,
            "unique_count": int(df[col].nunique(dropna=True)),
        })
    return info


def get_missing_values(df: pd.DataFrame) -> list[dict]:
    missing = []
    for col in df.columns:
        n = int(df[col].isna().sum())
        if n > 0:
            missing.append({
                "column": col,
                "missing_count": n,
                "missing_pct": round(n / len(df) * 100, 2),
            })
    return sorted(missing, key=lambda x: x["missing_count"], reverse=True)


def get_class_distribution(df: pd.DataFrame) -> list[dict]:
    total = len(df)
    dist = df["label"].value_counts(dropna=False).to_dict()
    result = []
    for label, count in dist.items():
        result.append({
            "label": str(label) if label is not None else "unlabeled",
            "count": int(count),
            "percentage": round(count / total * 100, 2) if total else 0.0,
        })
    return result


def get_duplicate_info(df: pd.DataFrame) -> dict:
    n = int(df.duplicated().sum())
    return {
        "duplicate_rows": n,
        "duplicate_pct": round(n / len(df) * 100, 2) if len(df) else 0.0,
    }


def get_sample_records(df: pd.DataFrame, n: int = 10) -> list[dict]:
    display_cols = [
        "user_id", "screen_name", "name", "followers_count", "friends_count",
        "statuses_count", "account_age_days", "verified", "label",
        "has_tweets", "has_neighbors", "domain",
    ]
    cols = [c for c in display_cols if c in df.columns]
    return json.loads(df[cols].head(n).to_json(orient="records"))


def get_basic_stats(df: pd.DataFrame) -> dict:
    cols = [c for c in [
        "followers_count", "friends_count", "statuses_count",
        "listed_count", "favourites_count", "account_age_days",
        "tweets_per_day", "followers_following_ratio", "description_length",
    ] if c in df.columns]
    return json.loads(df[cols].describe().round(2).to_json())


# ─────────────────────────────────────────────
# Module-level cache
# ─────────────────────────────────────────────
_cache: dict = {}


def get_or_load() -> tuple[pd.DataFrame, dict]:
    if "df" not in _cache:
        if os.path.exists(PROCESSED_CSV):
            _cache["df"]   = pd.read_csv(PROCESSED_CSV)
            _cache["meta"] = {"is_real_dataset": False, "data_note": "Loaded from processed CSV cache."}
        else:
            df, meta = preprocess()
            _cache["df"]   = df
            _cache["meta"] = meta
    return _cache["df"], _cache["meta"]


def reload() -> tuple[pd.DataFrame, dict]:
    _cache.clear()
    return get_or_load()
