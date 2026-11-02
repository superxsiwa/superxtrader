from __future__ import annotations

from datetime import datetime
import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import pandas as pd

from app.providers.base import MarketDataProviderError


class AlphaVantageProvider:
    def __init__(self, api_key: str | None = None, symbol_suffix: str | None = None):
        self.api_key = (
            os.getenv("ALPHA_VANTAGE_API_KEY", "").strip()
            if api_key is None
            else api_key.strip()
        )
        self.symbol_suffix = (
            os.getenv("ALPHA_VANTAGE_SYMBOL_SUFFIX", ".BKK")
            if symbol_suffix is None
            else symbol_suffix
        )

    def _symbol(self, symbol: str) -> str:
        if symbol.upper().endswith(".BK"):
            return f"{symbol[:-3]}{self.symbol_suffix}"
        return symbol

    def _request(self, params: dict) -> dict:
        if not self.api_key:
            raise MarketDataProviderError("ALPHA_VANTAGE_API_KEY is not configured.")

        params["apikey"] = self.api_key
        request = Request(
            f"https://www.alphavantage.co/query?{urlencode(params)}",
            headers={"User-Agent": "SuperXTrader/1.0"},
        )
        try:
            with urlopen(request, timeout=10) as response:
                payload = json.load(response)
        except HTTPError as error:
            raise MarketDataProviderError(f"Alpha Vantage returned HTTP {error.code}.") from error
        except (URLError, TimeoutError) as error:
            raise MarketDataProviderError("Could not connect to Alpha Vantage.") from error

        provider_message = payload.get("Error Message") or payload.get("Note") or payload.get("Information")
        if provider_message:
            raise MarketDataProviderError(f"Alpha Vantage request failed: {provider_message}")
        return payload

    def fetch_ohlcv(
        self,
        symbol: str,
        *,
        period: str | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> pd.DataFrame:
        payload = self._request({
            "function": "TIME_SERIES_DAILY",
            "symbol": self._symbol(symbol),
            "outputsize": "compact",
        })
        series_key = next((key for key in payload if "Time Series (Daily)" in key), None)
        if series_key is None:
            raise MarketDataProviderError("Alpha Vantage returned no daily time series.")

        data = pd.DataFrame.from_dict(payload[series_key], orient="index")
        data = data.rename(columns={
            "1. open": "Open",
            "2. high": "High",
            "3. low": "Low",
            "4. close": "Close",
            "5. volume": "Volume",
        })
        data.index = pd.to_datetime(data.index)
        data = data.astype({"Open": float, "High": float, "Low": float, "Close": float, "Volume": float})
        data = data.sort_index()
        if start is not None:
            data = data[data.index >= pd.Timestamp(start.date())]
        if end is not None:
            data = data[data.index <= pd.Timestamp(end.date())]
        return data

    def get_current_price(self, symbol: str) -> float | None:
        history = self.fetch_ohlcv(symbol, period="1d")
        if history.empty:
            return None
        return float(history["Close"].iloc[-1])

