# API Reference

> **Base URL**: `http://localhost:8000`
> **Version**: 0.5.0
> **Auto-generated docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Phase 1 — Health

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check — status, DB connection, API version |

---

## Phase 2 — Dataset

| Method | Endpoint | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dataset/summary` | — | Rows, columns, class counts, data note |
| `GET` | `/api/dataset/columns` | — | Per-column dtype, null count, unique count |
| `GET` | `/api/dataset/missing` | — | Columns with missing values (sorted) |
| `GET` | `/api/dataset/distribution` | — | Bot vs human class distribution |
| `GET` | `/api/dataset/duplicates` | — | Duplicate row count and percentage |
| `GET` | `/api/dataset/sample` | `n` (default 10, max 50) | First n records |
| `GET` | `/api/dataset/stats` | — | Descriptive statistics for numeric columns |
| `POST` | `/api/dataset/reload` | — | Force-reload dataset, invalidate all caches |

---

## Phase 3 — Behaviour Analytics

| Method | Endpoint | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/features/summary` | — | Feature list and labeled account counts |
| `GET` | `/api/features/stats` | — | Per-feature stats split by bot/human |
| `GET` | `/api/behaviour/comparison` | — | Bot vs human mean values (chart-ready) |
| `GET` | `/api/behaviour/boolean-rates` | — | Boolean flag rates: bots vs humans |
| `GET` | `/api/behaviour/score-distributions` | — | Histogram of activity/suspicion scores |
| `GET` | `/api/behaviour/account-tiers` | — | Bot vs human per follower-tier bucket |
| `GET` | `/api/behaviour/top-suspicious` | `n` (default 20, max 50) | Top suspicious accounts |
| `GET` | `/api/behaviour/scatter` | `x`, `y`, `max_points` | Scatter plot data for any two features |

---

## Phase 4 — Machine Learning

| Method | Endpoint | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ml/status` | — | Check whether models are trained |
| `POST` | `/api/ml/train` | — | Train LR, DT, RF (or use cache) |
| `GET` | `/api/ml/metrics` | — | CV + hold-out metrics for all models |
| `GET` | `/api/ml/feature-importance` | `model` (default Random Forest) | Feature importance scores |
| `GET` | `/api/ml/confusion-matrix` | `model` | Confusion matrix on hold-out set |
| `GET` | `/api/ml/roc` | `model` | ROC curve (fpr, tpr, auc) |
| `GET` | `/api/ml/roc-all` | — | ROC curves for all three models |

**Supported `model` values**: `Random Forest`, `Logistic Regression`, `Decision Tree`

---

## Phase 5 — NLP & Network Analysis

### NLP
| Method | Endpoint | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/nlp/sentiment` | — | VADER compound, pos, neu, neg for bot vs human |
| `GET` | `/api/nlp/tfidf` | `top_n` (default 20, max 50) | Top TF-IDF tokens (unigrams + bigrams) |
| `GET` | `/api/nlp/word-frequency` | `top_n` (default 30, max 50) | Word frequency counts |

### Network
| Method | Endpoint | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/network/summary` | — | Node count, edge count, density, avg degree |
| `GET` | `/api/network/metrics` | `top_n` (default 30, max 100) | Per-node PageRank, in/out degree |
| `GET` | `/api/network/degree-distribution` | — | Degree histogram by label |
| `GET` | `/api/network/top-pagerank` | `n` (default 20, max 50) | Top nodes by PageRank |
| `GET` | `/api/network/label-metrics` | — | Avg degree & PageRank per label |

---

## Phase 6 — Dashboard

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Aggregated stats: accounts, bot%, best model, network |

---

## Phase 7 — Account Investigation

| Method | Endpoint | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/investigate/stats` | — | Total, labeled, bot, human, high-risk counts |
| `GET` | `/api/investigate/accounts` | `page`, `page_size`, `label`, `sort_by` | Paginated account list |
| `GET` | `/api/investigate/account` | `query` | Full investigation report for an account |
| `GET` | `/api/investigate/search` | `q`, `n` | Autocomplete: accounts matching query |

### Account Investigation Response Structure
```json
{
  "found": true,
  "identity": { "user_id", "screen_name", "name", "label", "followers", ... },
  "scores": { "suspicion_score", "activity_score", "avg_bot_prob" },
  "verdict": "HIGH RISK — Likely Bot",
  "verdict_color": "danger",
  "ml_predictions": [{ "model", "bot_prob", "human_prob", "prediction" }],
  "suspicion_reasons": [{ "flag", "weight", "detail" }],
  "features": { "ff_ratio": ..., "tweets_per_day": ... },
  "population_comparison": [{ "feature", "account", "bot_avg", "human_avg", "closer_to" }]
}
```

### Pagination Parameters (`/api/investigate/accounts`)
| Parameter | Default | Description |
| :--- | :--- | :--- |
| `page` | 1 | Page number (1-indexed) |
| `page_size` | 50 | Accounts per page (max 100) |
| `label` | `all` | Filter: `all` \| `bot` \| `human` |
| `sort_by` | `suspicion_score` | Any numeric feature column |
