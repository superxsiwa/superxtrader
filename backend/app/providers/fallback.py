from __future__ import annotations

from datetime import datetime
import logging
import os
import pandas as pd

from app.providers.base import MarketDataProvider, MarketDataProviderError
from app.providers.yahoo import YahooFinanceProvider
from app.providers.eodhd import EODHDProvider
from app.providers.twelvedata import TwelveDataProvider
from app.providers.alphavantage import AlphaVantageProvider

logger = logging.getLogger(__name__)


def get_market_data_provider(provider_name: str | None = None) -> MarketDataProvider:
    selected_provider = (provider_name or os.getenv("DATA_PROVIDER", "YAHOO")).strip().upper()
    if selected_provider == "YAHOO":
        return YahooFinanceProvider()
    if selected_provider == "EODHD":
        return EODHDProvider()
    if selected_provider == "TWELVE_DATA":
        return TwelveDataProvider()
    if selected_provider == "ALPHA_VANTAGE":
        return AlphaVantageProvider()
    raise ValueError(f"Unsupported market data provider: {selected_provider}")


def get_fallback_data_provider(primary_provider: MarketDataProvider) -> MarketDataProvider | None:
    if isinstance(primary_provider, YahooFinanceProvider):
        if os.getenv("EODHD_API_TOKEN", "").strip():
            return EODHDProvider()
        if os.getenv("TWELVE_DATA_API_KEY", "").strip():
            return TwelveDataProvider()
        if not os.getenv("ALPHA_VANTAGE_API_KEY", "").strip():
            return None
        return AlphaVantageProvider()
    return YahooFinanceProvider()


def fetch_ohlcv_with_fallback(
    symbol: str,
    *,
    period: str | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
) -> pd.DataFrame:
    primary_provider = get_market_data_provider()
    fallback_provider = get_fallback_data_provider(primary_provider)
    try:
        history = primary_provider.fetch_ohlcv(symbol, period=period, start=start, end=end)
        if history is not None and not history.empty:
            return history
        raise MarketDataProviderError("Primary market data provider returned no data.")
    except Exception as primary_error:
        if fallback_provider is None:
            logger.warning(
                "Primary market data provider failed for %s and no fallback provider is configured: %s",
                symbol,
                primary_error,
            )
            return pd.DataFrame()
        logger.warning(
            "Primary market data provider failed for %s; trying %s: %s",
            symbol,
            type(fallback_provider).__name__,
            primary_error,
        )

    try:
        history = fallback_provider.fetch_ohlcv(symbol, period=period, start=start, end=end)
        if history is None or history.empty:
            raise MarketDataProviderError("Fallback market data provider returned no data.")
        logger.info("Market data for %s recovered with %s", symbol, type(fallback_provider).__name__)
        return history
    except Exception:
        logger.exception("Both market data providers failed for %s", symbol)
        return pd.DataFrame()


def get_current_price_with_fallback(symbol: str) -> float | None:
    primary_provider = get_market_data_provider()
    fallback_provider = get_fallback_data_provider(primary_provider)
    try:
        price = primary_provider.get_current_price(symbol)
        if price is not None:
            return price
        raise MarketDataProviderError("Primary market data provider returned no current price.")
    except Exception as primary_error:
        if fallback_provider is None:
            logger.warning(
                "Primary current-price provider failed for %s and no fallback provider is configured: %s",
                symbol,
                primary_error,
            )
            return None
        logger.warning(
            "Primary current-price provider failed for %s; trying %s: %s",
            symbol,
            type(fallback_provider).__name__,
            primary_error,
        )

    try:
        price = fallback_provider.get_current_price(symbol)
        if price is not None:
            return price
        raise MarketDataProviderError("Fallback provider returned no current price.")
    except Exception:
        logger.exception("Both current-price providers failed for %s", symbol)
        return None

