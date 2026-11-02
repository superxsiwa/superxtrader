from __future__ import annotations

from datetime import datetime
from typing import Protocol
import pandas as pd


class MarketDataProviderError(RuntimeError):
    pass


class MarketDataProvider(Protocol):
    def fetch_ohlcv(
        self,
        symbol: str,
        *,
        period: str | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> pd.DataFrame: ...

    def get_current_price(self, symbol: str) -> float | None: ...

