
import asyncio
import json
import random
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.nlp.finbert_encoder import analyze_sentiment


ROOT = Path(__file__).resolve().parents[2]
BOOKS = ROOT / "backend" / "data" / "mock" / "order_book.json"
NEWS = ROOT / "backend" / "data" / "mock" / "news.json"

app = FastAPI(
    title="QuantFormer API",
    version="0.2.0",
    description="Mock multimodal market research demo API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated in-memory market state.
current_price = None
price_history = []
MAX_HISTORY = 60


def load(path: Path):
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def book_summary(book):
    bids = book["bids"]
    asks = book["asks"]

    bid_depth = sum(float(level["volume"]) for level in bids)
    ask_depth = sum(float(level["volume"]) for level in asks)

    best_bid = float(bids[0]["price"])
    best_ask = float(asks[0]["price"])

    return {
        **book,
        "best_bid": best_bid,
        "best_ask": best_ask,
        "mid_price": round((best_bid + best_ask) / 2, 4),
        "spread": round(best_ask - best_bid, 4),
        "bid_depth": bid_depth,
        "ask_depth": ask_depth,
        "order_book_imbalance": round(
            (bid_depth - ask_depth)
            / max(bid_depth + ask_depth, 1),
            4,
        ),
    }


def annotated_news():
    items = load(NEWS)

    return [
        {
            **item,
            "sentiment": analyze_sentiment(item["headline"]),
        }
        for item in items
    ]


def get_market():
    """Create a new simulated price point and update the history."""
    global current_price

    book = book_summary(load(BOOKS)[0])
    base_price = book["mid_price"]

    if current_price is None:
        current_price = base_price

    # Small random walk around the previous price.
    current_price += random.uniform(-0.12, 0.12)
    current_price = max(0.01, round(current_price, 4))

    now = datetime.now(timezone.utc)

    book["last_price"] = current_price
    book["mid_price"] = current_price

    price_history.append(
        {
            "time": int(now.timestamp()),
            "price": current_price,
        }
    )

    # Keep chart timestamps unique and history bounded.
    price_history[:] = price_history[-MAX_HISTORY:]

    return book


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "QuantFormer API",
    }


@app.get("/api/snapshot")
def snapshot():
    market = get_market()

    return {
        "market": market,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "price_history": price_history.copy(),
    }


@app.get("/api/news")
def news():
    return {
        "items": annotated_news(),
    }


@app.get("/api/forecast")
def forecast():
    market = book_summary(load(BOOKS)[0])
    items = annotated_news()

    scores = [
        1 if item["sentiment"]["label"] == "positive"
        else -1 if item["sentiment"]["label"] == "negative"
        else 0
        for item in items
    ]

    sentiment_score = sum(scores) / max(len(scores), 1)

    change_pct = (
        market["order_book_imbalance"] * 0.0008
        + sentiment_score * 0.001
    ) * 100

    predicted_price = round(
        market["mid_price"] * (1 + change_pct / 100),
        4,
    )

    return {
        "symbol": market["symbol"],
        "current_mid_price": market["mid_price"],
        "prediction": predicted_price,
        "predicted_price": predicted_price,
        "predicted_mid_price": predicted_price,
        "predicted_change_pct": round(change_pct, 4),
        "sentiment_score": round(sentiment_score, 4),
        "horizon": "demo",
        "model": "Illustrative rule-based baseline (not trained TFT)",
        "warning": "Mock data only; not investment advice.",
    }


@app.websocket("/ws/market")
async def market_stream(websocket: WebSocket):
    await websocket.accept()
    books = load(BOOKS)
    items = annotated_news()
    index = 0

    try:
        while True:
            market = get_market()

            await websocket.send_json(
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "symbol": market["symbol"],
                    "price": market["last_price"],
                    "spread": market["spread"],
                    "imbalance": market["order_book_imbalance"],
                    "news": items[index % len(items)] if items else None,
                }
            )

            index += 1
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        pass
