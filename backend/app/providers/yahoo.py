from __future__ import annotations

from datetime import datetime
import pandas as pd


class YahooFinanceProvider:
    def fetch_ohlcv(
        self,
        symbol: str,
        *,
        period: str | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> pd.DataFrame:
        import yfinance as yf

        ticker = yf.Ticker(symbol)
        if period is not None:
            return ticker.history(period=period)
        return ticker.history(start=start, end=end)

    def get_current_price(self, symbol: str) -> float | None:
        import yfinance as yf

        ticker = yf.Ticker(symbol)
        try:
            price = ticker.fast_info.get("last_price")
        except Exception:
            price = None

        if price is not None and pd.notna(price):
            return float(price)

        history = ticker.history(period="1d")
        if history.empty:
            return None
        return float(history["Close"].iloc[-1])

