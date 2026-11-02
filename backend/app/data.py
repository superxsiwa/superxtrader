from __future__ import annotations

from datetime import datetime, timedelta

from app.providers import (
    MarketDataProvider,
    MarketDataProviderError,
    YahooFinanceProvider,
    EODHDProvider,
    TwelveDataProvider,
    AlphaVantageProvider,
    get_market_data_provider,
    get_fallback_data_provider,
    fetch_ohlcv_with_fallback,
    get_current_price_with_fallback,
)

__all__ = [
    "MarketDataProvider",
    "MarketDataProviderError",
    "YahooFinanceProvider",
    "EODHDProvider",
    "TwelveDataProvider",
    "AlphaVantageProvider",
    "get_market_data_provider",
    "get_fallback_data_provider",
    "fetch_ohlcv_with_fallback",
    "get_current_price_with_fallback",
    "fetch_real_market_data",
    "get_market_data",
]


def fetch_real_market_data(symbol: str, days: int = 90) -> list[dict]:
    end_date = datetime.today()
    start_date = end_date - timedelta(days=days)

    df = fetch_ohlcv_with_fallback(symbol, start=start_date, end=end_date)
    if df.empty:
        return []

    points = []
    for index, row in df.iterrows():
        points.append({
            "date": index.strftime("%Y-%m-%d"),
            "open": round(row['Open'], 2),
            "high": round(row['High'], 2),
            "low": round(row['Low'], 2),
            "close": round(row['Close'], 2),
            "volume": int(row['Volume']),
        })

    return points


def get_market_data():
    from app.core.database import SessionLocal
    from app.models.all_models import Stock

    db = SessionLocal()
    try:
        active_stocks = db.query(Stock).filter(Stock.is_active == True).all()
        symbols = [s.symbol for s in active_stocks]
    finally:
        db.close()

    market = {}
    for sym in symbols:
        history = fetch_real_market_data(sym)
        if not history:
            continue

        market[sym.replace(".BK", "")] = {
            "name": sym.replace(".BK", ""),
            "history": history,
            "current_price": history[-1]["close"],
            "change_pct": round(((history[-1]["close"] - history[-2]["close"]) / history[-2]["close"]) * 100, 2) if len(history) > 1 else 0,
            "volume": history[-1]["volume"],
        }
    return market
