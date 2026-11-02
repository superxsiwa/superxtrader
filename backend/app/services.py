from __future__ import annotations

import math
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.data import get_current_price_with_fallback, get_market_data
from app.modules.analysis import analysis_engine
from app.modules.ingestion import market_ingestion
from app.modules.ledger import portfolio_ledger
from app.modules.risk import risk_sizer


def generate_signal_for_symbol(symbol: str, info: Dict) -> Dict:
    history = info.get("history", [])
    clean_sym = symbol.strip().upper().removesuffix(".BK")
    sig = analysis_engine.analyze_history(clean_sym, history)
    rec = "BUY" if "BUY" in sig.signal_type else ("SELL" if "SELL" in sig.signal_type else "WATCH")

    p = sig.entry_price
    ema50 = sig.indicators.ema50
    ema20 = sig.indicators.ema20
    if p > ema20 > ema50 and sig.indicators.volume_ratio >= 1.2:
        zone = "Bullish Breakout"
    elif ema20 < ema50 and p < ema20:
        zone = "Bearish Momentum"
    elif p > ema50:
        zone = "Trend Support"
    else:
        zone = "Neutral"

    return {
        "symbol": clean_sym,
        "name": info.get("name", clean_sym),
        "price": round(sig.entry_price, 2),
        "change_pct": info.get("change_pct", 0.0),
        "rsi": sig.indicators.rsi14,
        "macd": sig.indicators.macd,
        "ema50": sig.indicators.ema50,
        "ema90": round(sig.indicators.ema200 * 0.95, 2),
        "ema20": sig.indicators.ema20,
        "ema200": sig.indicators.ema200,
        "atr14": sig.indicators.atr14,
        "volume_ratio": sig.indicators.volume_ratio,
        "action_zone": zone,
        "recommendation": rec,
        "signal_type": sig.signal_type,
        "strategy_name": sig.strategy_name,
        "suggested_stop_loss": sig.suggested_stop_loss,
        "suggested_take_profit": sig.suggested_take_profit,
        "score": sig.score,
        "confidence": sig.confidence,
        "indicators": sig.indicators.model_dump(),
    }


def scan_market() -> List[Dict]:
    """
    โมดูลที่ 1 + 2: ดึงข้อมูลตลาดและสแกนหาสัญญาณตามกลยุทธ์
    """
    market = market_ingestion.fetch_all_active_market()
    scan_results = []

    for sym, info in market.items():
        history = info.get("history", [])
        if not history:
            continue

        try:
            signal = generate_signal_for_symbol(sym, info)
            scan_results.append(signal)
        except Exception:
            continue

    scan_results.sort(key=lambda x: x["score"], reverse=True)
    return scan_results



def get_symbol_chart(symbol: str) -> List[Dict]:
    market = get_market_data()
    normalized_symbol = symbol.strip().upper().removesuffix(".BK")
    data = market.get(normalized_symbol)
    if not data:
        raise ValueError(f"Symbol {symbol} not found")
    return data["history"]


def get_portfolio_summary(db: Session, user_id: int) -> Dict:
    """
    โมดูลที่ 5: สรุปสถานะพอร์ตโฟลิโอ บันทึกต้นทุนเฉลี่ยถ่วงน้ำหนักและ P/L
    """
    return portfolio_ledger.get_portfolio_summary(
        db, user_id, price_fetcher=get_current_price_with_fallback
    )



def process_trade(
    db: Session,
    user_id: int,
    symbol: str,
    action: str,
    quantity: int,
    price: Optional[float] = None,
    strategy_tag: str = "MANUAL",
    stop_loss_price: Optional[float] = None,
    take_profit_price: Optional[float] = None,
    order_type: str = "LIMIT",
) -> Dict:
    """
    โมดูลที่ 4 + 5: ประมวลผลคำสั่งซื้อขาย คำนวณค่าธรรมเนียม และบันทึกเข้า Ledger
    """
    result = portfolio_ledger.execute_and_record_trade(
        db=db,
        user_id=user_id,
        symbol=symbol,
        action=action,
        quantity=quantity,
        price=price,
        strategy_tag=strategy_tag,
        stop_loss_price=stop_loss_price,
        take_profit_price=take_profit_price,
        order_type=order_type,
    )
    # คืนค่า summary ของพอร์ตพร้อมข้อมูล execution
    summary = result["portfolio"]
    summary["execution"] = result["execution"]
    summary["realized_pl_trade"] = result["realized_pl"]
    return summary


def calculate_position_sizing(
    db: Session,
    user_id: int,
    symbol: str,
    entry_price: Optional[float] = None,
    stop_loss_price: Optional[float] = None,
    take_profit_price: Optional[float] = None,
    risk_pct_per_trade: float = 0.01,
) -> Dict:
    """
    โมดูลที่ 3: คำนวณขนาดไม้และการจัดการความเสี่ยงจากเงินในพอร์ต
    """
    portfolio_data = portfolio_ledger.get_portfolio_summary(db, user_id)
    equity = portfolio_data["equity"]
    cash = portfolio_data["cash"]

    clean_sym = symbol.strip().upper().removesuffix(".BK")
    if entry_price is None or entry_price <= 0:
        quote = market_ingestion.get_latest_quote(clean_sym)
        entry_price = quote if (quote and quote > 0) else 50.0

    if stop_loss_price is None or stop_loss_price <= 0:
        stop_loss_price = round(entry_price * 0.95, 2)

    plan = risk_sizer.calculate_sizing(
        symbol=clean_sym,
        entry_price=entry_price,
        stop_loss_price=stop_loss_price,
        portfolio_equity=equity,
        available_cash=cash,
        risk_pct_per_trade=risk_pct_per_trade,
        take_profit_price=take_profit_price,
    )
    return plan.model_dump()
