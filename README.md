# QuantFormer — Multimodal Order Book & Sentiment Transformer

Starter project for exploring Level-2 (L2) order-book features and financial-news sentiment in a market dashboard.

## Run locally (no Docker/WSL required)

### Backend (PowerShell, project root)
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn backend.api.main:app --reload
```
API docs: http://127.0.0.1:8000/docs

### Frontend (second terminal)
Requires Node.js LTS: https://nodejs.org/
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

The UI refreshes mock market data every four seconds. API routes: `/health`, `/api/snapshot`, `/api/news`, `/api/forecast`, and WebSocket `/ws/market`.

## Project scope and limitations
- The dashboard and FastAPI endpoints run on mock data.
- Sentiment uses a transparent keyword fallback by default. To use FinBERT, install `transformers torch`, set `$env:USE_FINBERT="1"`, then restart the backend. First model load downloads weights.
- Kafka producers are included but require a separately running Kafka broker; Docker/WSL are not needed for the dashboard demo.
- TFT model construction/training files are scaffolds. The included forecast is an illustrative rule-based baseline, **not a trained TFT prediction**. A real model requires a substantial timestamped dataset, proper temporal validation, and evaluation.
- Synthetic/mock outputs are for demonstration only, not financial advice.

## Structure
`backend/` API, Kafka producer scripts, sentiment, forecasting scaffolds and mock data. `frontend/` React/Vite/Lightweight Charts UI. `config/` settings. `tests/` API smoke tests.
