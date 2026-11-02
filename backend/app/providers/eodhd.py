from __future__ import annotations

from datetime import datetime
import json
import os
from time import monotonic
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import pandas as pd

from app.providers.base import MarketDataProviderError


class EODHDProvider:
    _quote_cache: dict[str, tuple[float, float]] = {}
    _quote_cache_ttl_seconds = 15 * 60

    def __init__(self, api_token: str | None = None):
        self.api_token = (
            os.getenv("EODHD_API_TOKEN", "").strip()
            if api_token is None
            else api_token.strip()
        )

    def _request(self, endpoint: str, params: dict) -> object:
        if not self.api_token:
            raise MarketDataProviderError("EODHD_API_TOKEN is not configured.")

        query = {**params, "api_token": self.api_token, "fmt": "json"}
        request = Request(
            f"https://eodhd.com/api/{endpoint}?{urlencode(query)}",
            headers={"User-Agent": "SuperXTrader/1.0"},
        )
        try:
            with urlopen(request, timeout=10) as response:
                payload = json.load(response)
        except HTTPError as error:
            try:
                body = error.read().decode("utf-8")
                error_payload = json.loads(body)
            except (UnicodeDecodeError, json.JSONDecodeError):
                error_payload = {}
            if isinstance(error_payload, dict):
                message = error_payload.get("message") or error_payload.get("error")
            else:
                message = None
            detail = f": {message}" if message else "."
            raise MarketDataProviderError(f"EODHD returned HTTP {error.code}{detail}") from error
        except (URLError, TimeoutError) as error:
            raise MarketDataProviderError("Could not connect to EODHD.") from error

        if isinstance(payload, dict):
            message = payload.get("message") or payload.get("error")
            if message:
                raise MarketDataProviderError(f"EODHD request failed: {message}")
        return payload

    def fetch_ohlcv(
        self,
        symbol: str,
        *,
        period: str | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> pd.DataFrame:
        params = {"period": "d", "order": "a"}
        if start is not None:
            params["from"] = start.strftime("%Y-%m-%d")
        if end is not None:
            params["to"] = end.strftime("%Y-%m-%d")

        payload = self._request(f"eod/{symbol}", params)
        if not isinstance(payload, list) or not payload:
            raise MarketDataProviderError("EODHD returned no daily time series.")

        data = pd.DataFrame(payload)
        if "date" not in data:
            raise MarketDataProviderError("EODHD returned malformed daily time series.")
        data.index = pd.to_datetime(data.pop("date"))
        data = data.rename(columns={
            "open": "Open",
            "high": "High",
            "low": "Low",
            "close": "Close",
            "volume": "Volume",
        })
        required_columns = ["Open", "High", "Low", "Close", "Volume"]
        if not all(column in data.columns for column in required_columns):
            raise MarketDataProviderError("EODHD returned incomplete OHLCV data.")
        data = data[required_columns].apply(pd.to_numeric, errors="coerce")
        data = data.dropna(subset=["Open", "High", "Low", "Close"]).sort_index()
        if start is not None:
            data = data[data.index >= pd.Timestamp(start.date())]
        if end is not None:
            data = data[data.index <= pd.Timestamp(end.date())]
        return data

    def get_current_price(self, symbol: str) -> float | None:
        now = monotonic()
        cached_quote = self._quote_cache.get(symbol)
        if cached_quote and now - cached_quote[0] < self._quote_cache_ttl_seconds:
            return cached_quote[1]

        payload = self._request(f"real-time/{symbol}", {})
        if not isinstance(payload, dict):
            raise MarketDataProviderError("EODHD returned malformed live quote data.")
        price = payload.get("close")
        if price is None:
            return None
        price = float(price)
        self._quote_cache[symbol] = (now, price)
        return price

