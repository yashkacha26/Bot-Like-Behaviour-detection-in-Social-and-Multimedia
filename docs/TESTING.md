# Testing Guide

## Overview

The test suite covers all 7 implemented phases using **pytest** with FastAPI's `TestClient`.  
Each phase has its own test file with unit tests and integration (API) tests.

| Test File | Phase | # Tests (approx.) |
| :--- | :--- | :--- |
| `test_phase1.py` | Health check, DB creation | 3 |
| `test_phase2.py` | Dataset generator, preprocessing, EDA, API | 13 |
| `test_phase3.py` | Feature engineering, behaviour analytics, API | 18 |
| `test_phase4.py` | ML pipeline, metrics, confusion matrix, API | 16 |
| `test_phase5.py` | NLP analysis, network analysis, API | 17 |
| `test_phase6_7.py` | Dashboard, account investigation, API | 22 |
| **Total** | | **~89 tests** |

---

## Running Tests

### Prerequisites
```bash
# Activate the virtual environment
.venv\Scripts\activate   # Windows
source .venv/bin/activate  # Linux/Mac

# Install test dependencies (already in requirements.txt)
pip install pytest httpx
```

### Run All Tests
```bash
# From project root
pytest tests/ -v
```

### Run a Specific Phase
```bash
pytest tests/test_phase4.py -v
```

### Run with Coverage
```bash
pip install pytest-cov
pytest tests/ --cov=backend --cov-report=term-missing
```

### Stop on First Failure
```bash
pytest tests/ -x -v
```

---

## Test Architecture

### Isolation Strategy
Each test file uses **pytest fixtures** with `monkeypatch` to:
1. Redirect dataset paths to a `tmp_path` (pytest-managed temp directory)
2. Clear all in-memory caches (`_cache`, `_fe_cache`, `_ml_cache`, etc.)
3. Generate a small synthetic dataset (60 human + 40 bot by default)
4. Create an isolated `TestClient` wrapping the FastAPI app

This ensures tests are **fully deterministic** and don't pollute production data.

### Fixture Hierarchy
```
patched_env (tmp_path + monkeypatched modules)
    └── api_client (TestClient wrapping main.app)
```

---

## Test Categories

### Unit Tests
- Test individual Python functions in isolation
- Use the `small_df` fixture (minimal DataFrame, no I/O)
- Examples: `test_suspicion_score_range`, `test_rf_importance_sums_to_one`

### Integration Tests
- Test full HTTP request/response cycle via FastAPI TestClient
- Named `test_api_*` across all test files
- Examples: `test_api_ml_train`, `test_api_investigate_account_found`

### Edge Case Tests
- `test_api_investigate_account_not_found` → 404 response
- `test_api_investigate_search_empty_query` → empty list
- `test_verdict_low_risk` → zero suspicion reasons
- `test_verdict_high_risk` → ≥ 60 weight from flags

---

## Known Limitations

| Limitation | Reason |
| :--- | :--- |
| ML tests use small dataset (100 accounts) | Speed; real CV metrics are not meaningful at this scale |
| NLP uses synthetic tweet corpus | Real TwiBot-20 tweet data requires research access |
| Network graph uses simulated edges | Same; real follower edges not publicly available in demo |
| No frontend E2E tests | Outside scope; Recharts renders are complex to test headlessly |

---

## Adding New Tests

1. Create `tests/test_phaseN.py`
2. Add `sys.path.insert(0, ...)` pointing to `backend/`
3. Use the standard `patched_env` / `api_client` fixtures (copy from any existing test file)
4. Name unit tests `test_*`, API tests `test_api_*`
5. Run with `pytest tests/test_phaseN.py -v` before committing

---

## CI Integration (Future)

To add GitHub Actions CI, create `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt pytest httpx
      - run: pytest tests/ -v --tb=short
```
