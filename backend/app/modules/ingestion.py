from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel

from app.data import (
    fetch_real_market_data,
    get_current_price_with_fallback,
    get_market_data,
)

logger = logging.getLogger(__name__)


class NormalizedOHLCV(BaseModel):
    symbol: str
    market: str = "SET"
    timeframe: str = "1D"
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class MarketDataIngestion:
    """
    โมดูลที่ 1: ตัวอ่านและดึงข้อมูลราคาหุ้น (Market Data Ingestion)
    ดึงข้อมูลราคา Real-time และ Historical/EOD OHLCV จัดรูปแบบให้เป็นมาตรฐานเดียวกัน (Normalized)
    """

    @staticmethod
    def get_standardized_symbol(symbol: str) -> str:
        s = symbol.strip().upper()
        if not s.endswith(".BK"):
            return f"{s}.BK"
        return s

    @staticmethod
    def clean_symbol(symbol: str) -> str:
        return symbol.strip().upper().removesuffix(".BK")

    def fetch_historical_ohlcv(
        self, symbol: str, timeframe: str = "1D", days: int = 120
    ) -> List[NormalizedOHLCV]:
        std_symbol = self.get_standardized_symbol(symbol)
        raw_points = fetch_real_market_data(std_symbol, days=days)
        clean_sym = self.clean_symbol(symbol)

        normalized: List[NormalizedOHLCV] = []
        for p in raw_points:
            ts = p.get("date", datetime.now(timezone.utc).date().isoformat())
            normalized.append(
                NormalizedOHLCV(
                    symbol=clean_sym,
                    market="SET",
                    timeframe=timeframe,
                    timestamp=f"{ts}T16:30:00+07:00" if "T" not in ts else ts,
                    open=float(p["open"]),
                    high=float(p["high"]),
                    low=float(p["low"]),
                    close=float(p["close"]),
                    volume=int(p["volume"]),
                )
            )
        return normalized

    def get_latest_quote(self, symbol: str) -> Optional[float]:
        std_symbol = self.get_standardized_symbol(symbol)
        return get_current_price_with_fallback(std_symbol)

    def fetch_all_active_market(self) -> Dict[str, Dict]:
        """
        ดึงข้อมูลหุ้นที่ Active ทั้งหมดในระบบจากผู้ให้บริการตลาด
        """
        return get_market_data()


market_ingestion = MarketDataIngestion()

