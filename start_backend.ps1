# Run the FastAPI backend
# Usage: .\start_backend.ps1
$env:PYTHONPATH = "backend"
.venv\Scripts\uvicorn backend.main:app --reload --port 8000
