from __future__ import annotations

from datetime import datetime
import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import pandas as pd

from app.providers.base import MarketDataProviderError


class TwelveDataProvider:
    def __init__(self, api_key: str | None = None):
        self.api_key = (
            os.getenv("TWELVE_DATA_API_KEY", "").strip()
            if api_key is None
            else api_key.strip()
        )

    def _request(self, endpoint: str, params: dict) -> dict:
        if not self.api_key:
            raise MarketDataProviderError("TWELVE_DATA_API_KEY is not configured.")

        query = {**params, "apikey": self.api_key}
        request = Request(
            f"https://api.twelvedata.com/{endpoint}?{urlencode(query)}",
            headers={"User-Agent": "SuperXTrader/1.0"},
        )
        try:
            with urlopen(request, timeout=10) as response:
                payload = json.load(response)
        except HTTPError as error:
            try:
                error_payload = json.loads(error.read().decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                error_payload = {}
            message = error_payload.get("message")
            detail = f": {message}" if message else "."
            raise MarketDataProviderError(
                f"Twelve Data returned HTTP {error.code}{detail}"
            ) from error
        except (URLError, TimeoutError) as error:
            raise MarketDataProviderError("Could not connect to Twelve Data.") from error

        if payload.get("status") == "error" or payload.get("code", 0) >= 400:
            message = payload.get("message", "request failed")
            raise MarketDataProviderError(f"Twelve Data request failed: {message}")
        return payload

    @staticmethod
    def _symbol_params(symbol: str) -> dict:
        if symbol.upper().endswith(".BK"):
            return {"symbol": symbol[:-3], "mic_code": "XBKK"}
        return {"symbol": symbol}

    def fetch_ohlcv(
        self,
        symbol: str,
        *,
        period: str | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> pd.DataFrame:
        params = {
            **self._symbol_params(symbol),
            "interval": "1day",
            "outputsize": "5000",
            "order": "ASC",
        }
        if start is not None:
            params["start_date"] = start.strftime("%Y-%m-%d")
        if end is not None:
            params["end_date"] = end.strftime("%Y-%m-%d")
        payload = self._request("time_series", params)
        values = payload.get("values")
        if not values:
            raise MarketDataProviderError("Twelve Data returned no daily time series.")

        data = pd.DataFrame(values)
        if "datetime" not in data:
            raise MarketDataProviderError("Twelve Data returned malformed daily time series.")
        data.index = pd.to_datetime(data.pop("datetime"))
        data = data.rename(columns={
            "open": "Open",
            "high": "High",
            "low": "Low",
            "close": "Close",
            "volume": "Volume",
        })
        required_columns = ["Open", "High", "Low", "Close", "Volume"]
        if not all(column in data.columns for column in required_columns):
            raise MarketDataProviderError("Twelve Data returned incomplete OHLCV data.")
        data = data[required_columns].apply(pd.to_numeric, errors="coerce")
        data = data.dropna(subset=["Open", "High", "Low", "Close"]).sort_index()
        if start is not None:
            data = data[data.index >= pd.Timestamp(start.date())]
        if end is not None:
            data = data[data.index <= pd.Timestamp(end.date())]
        return data

    def get_current_price(self, symbol: str) -> float | None:
        payload = self._request("price", self._symbol_params(symbol))
        price = payload.get("price")
        if price is None:
            return None
        return float(price)

