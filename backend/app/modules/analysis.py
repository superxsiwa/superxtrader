from __future__ import annotations

import math
from typing import Dict, List, Optional
from pydantic import BaseModel


class Indicators(BaseModel):
    ema20: float
    ema50: float
    ema200: float
    rsi14: float
    macd: float
    macd_signal: float
    macd_hist: float
    atr14: float
    volume_ratio: float
    volume_sma20: float
    bb_upper: float
    bb_middle: float
    bb_lower: float
    stoch_k: float
    stoch_d: float


class SignalResult(BaseModel):
    symbol: str
    signal_type: str  # "BUY_SIGNAL", "SELL_SIGNAL", "WATCH"
    strategy_name: str
    entry_price: float
    indicators: Indicators
    suggested_stop_loss: float
    suggested_take_profit: float
    score: int
    confidence: int


def calculate_ema(values: List[float], period: int) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return float(values[0])
    multiplier = 2 / (period + 1)
    ema_val = values[0]
    for v in values[1:]:
        ema_val = (v - ema_val) * multiplier + ema_val
    return float(ema_val)


def calculate_ema_series(values: List[float], period: int) -> List[float]:
    if not values:
        return []
    multiplier = 2 / (period + 1)
    series = [values[0]]
    for v in values[1:]:
        series.append((v - series[-1]) * multiplier + series[-1])
    return series


def calculate_rsi(closes: List[float], period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
    recent_deltas = deltas[-period:]
    gains = sum(max(d, 0) for d in recent_deltas)
    losses = abs(sum(min(d, 0) for d in recent_deltas))
    if losses == 0:
        return 100.0 if gains > 0 else 50.0
    rs = gains / losses
    return round(100.0 - (100.0 / (1.0 + rs)), 2)


def calculate_macd(closes: List[float]) -> tuple[float, float, float]:
    if len(closes) < 26:
        return 0.0, 0.0, 0.0
    ema12_series = calculate_ema_series(closes, 12)
    ema26_series = calculate_ema_series(closes, 26)
    macd_line_series = [fast - slow for fast, slow in zip(ema12_series, ema26_series)]
    signal_series = calculate_ema_series(macd_line_series[-26:], 9)

    macd_line = macd_line_series[-1]
    signal_line = signal_series[-1]
    hist = macd_line - signal_line
    return round(macd_line, 2), round(signal_line, 2), round(hist, 2)


def calculate_atr(highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> float:
    if len(closes) < 2:
        return 1.0
    true_ranges = []
    for i in range(1, len(closes)):
        h = highs[i]
        l = lows[i]
        prev_c = closes[i - 1]
        tr = max(h - l, abs(h - prev_c), abs(l - prev_c))
        true_ranges.append(tr)

    if not true_ranges:
        return 1.0
    recent_trs = true_ranges[-period:]
    return round(sum(recent_trs) / len(recent_trs), 2)


def calculate_bollinger_bands(closes: List[float], period: int = 20, num_std: float = 2.0) -> tuple[float, float, float]:
    if len(closes) < period:
        c = closes[-1] if closes else 0.0
        return round(c * 1.05, 2), round(c, 2), round(c * 0.95, 2)
    sample = closes[-period:]
    mean = sum(sample) / period
    variance = sum((x - mean) ** 2 for x in sample) / period
    std_dev = math.sqrt(variance)
    upper = mean + (num_std * std_dev)
    lower = mean - (num_std * std_dev)
    return round(upper, 2), round(mean, 2), round(lower, 2)


def calculate_stochastic(highs: List[float], lows: List[float], closes: List[float], k_period: int = 14, d_period: int = 3) -> tuple[float, float]:
    if len(closes) < k_period:
        return 50.0, 50.0
    k_values = []
    for i in range(k_period, len(closes) + 1):
        window_highs = highs[i - k_period : i]
        window_lows = lows[i - k_period : i]
        highest_h = max(window_highs)
        lowest_l = min(window_lows)
        current_c = closes[i - 1]
        if highest_h == lowest_l:
            k_values.append(50.0)
        else:
            k = ((current_c - lowest_l) / (highest_h - lowest_l)) * 100.0
            k_values.append(k)

    stoch_k = k_values[-1] if k_values else 50.0
    recent_k = k_values[-d_period:]
    stoch_d = sum(recent_k) / len(recent_k) if recent_k else stoch_k
    return round(stoch_k, 2), round(stoch_d, 2)


class SignalAnalysisEngine:
    """
    โมดูลที่ 2: ระบบวิเคราะห์และสแกนสัญญาณ (Signal & Analysis Engine)
    ประมวลผล Technical Indicators และค้นหาสัญญาณด้วย Rule-Based Screener
    """

    def analyze_history(self, symbol: str, history: List[dict]) -> SignalResult:
        if not history:
            raise ValueError(f"No price history for symbol {symbol}")

        closes = [float(h["close"]) for h in history]
        highs = [float(h.get("high", h["close"])) for h in history]
        lows = [float(h.get("low", h["close"])) for h in history]
        volumes = [float(h["volume"]) for h in history]

        entry_price = round(closes[-1], 2)

        # 1. Technical Indicators
        ema20 = round(calculate_ema(closes[-20:], 20), 2)
        ema50 = round(calculate_ema(closes[-50:], 50), 2)
        ema200 = round(calculate_ema(closes[-200:], 200) if len(closes) >= 200 else calculate_ema(closes, min(len(closes), 200)), 2)

        rsi14 = calculate_rsi(closes, 14)
        macd_line, macd_sig, macd_hist = calculate_macd(closes)
        atr14 = max(0.05, calculate_atr(highs, lows, closes, 14))

        bb_upper, bb_mid, bb_lower = calculate_bollinger_bands(closes, 20, 2.0)
        stoch_k, stoch_d = calculate_stochastic(highs, lows, closes, 14, 3)

        # Volume stats
        recent_vol = volumes[-1]
        vol_window = volumes[-20:] if len(volumes) >= 20 else volumes
        avg_vol = sum(vol_window) / len(vol_window) if vol_window else 1.0
        volume_ratio = round(recent_vol / avg_vol, 2) if avg_vol > 0 else 1.0

        indicators = Indicators(
            ema20=ema20,
            ema50=ema50,
            ema200=ema200,
            rsi14=rsi14,
            macd=macd_line,
            macd_signal=macd_sig,
            macd_hist=macd_hist,
            atr14=atr14,
            volume_ratio=volume_ratio,
            volume_sma20=round(avg_vol, 0),
            bb_upper=bb_upper,
            bb_middle=bb_mid,
            bb_lower=bb_lower,
            stoch_k=stoch_k,
            stoch_d=stoch_d,
        )

        # 2. Rule-Based Screener Strategies
        signal_type = "WATCH"
        strategy_name = "Consolidation"

        # Check Breakout Volume Spike:
        # High of last 20 days (excluding today)
        prev_20_high = max(highs[-21:-1]) if len(highs) >= 21 else highs[-1]
        is_breakout = entry_price >= prev_20_high and volume_ratio >= 1.4 and 52 <= rsi14 <= 75
        is_trend_continuation = entry_price > ema20 > ema50 and macd_line > 0 and rsi14 >= 52
        is_oversold_rebound = (rsi14 < 38 or stoch_k < 25) and entry_price > lows[-1] and macd_hist > -0.2
        is_exit_signal = entry_price < ema20 and (macd_line < 0 or rsi14 < 45)

        if is_breakout:
            signal_type = "BUY_SIGNAL"
            strategy_name = "Breakout_Volume_Spike"
        elif is_trend_continuation and volume_ratio >= 1.0:
            signal_type = "BUY_SIGNAL"
            strategy_name = "Trend_Continuation"
        elif is_oversold_rebound:
            signal_type = "BUY_SIGNAL"
            strategy_name = "Oversold_Rebound"
        elif is_exit_signal:
            signal_type = "SELL_SIGNAL"
            strategy_name = "Exit_Rule"

        # 3. Suggested Stop Loss & Take Profit
        # Standard: Stop Loss = Entry - (2 * ATR), Take Profit = Entry + (2 * Risk per share) -> Risk/Reward = 2.0
        risk_buffer = round(2.0 * atr14, 2)
        suggested_stop_loss = round(max(0.1, entry_price - risk_buffer), 2)
        risk_per_share = max(0.05, entry_price - suggested_stop_loss)
        suggested_take_profit = round(entry_price + (2.0 * risk_per_share), 2)

        # 4. Score & Confidence
        score = 50
        score += int((rsi14 - 50) * 0.4)
        score += int(min(macd_line * 10, 20))
        score += int(min((volume_ratio - 1.0) * 25, 20))
        if entry_price > ema50 > ema200:
            score += 15
        score = max(0, min(100, score))
        confidence = min(95, max(45, score - 10))

        return SignalResult(
            symbol=symbol,
            signal_type=signal_type,
            strategy_name=strategy_name,
            entry_price=entry_price,
            indicators=indicators,
            suggested_stop_loss=suggested_stop_loss,
            suggested_take_profit=suggested_take_profit,
            score=score,
            confidence=confidence,
        )


analysis_engine = SignalAnalysisEngine()

