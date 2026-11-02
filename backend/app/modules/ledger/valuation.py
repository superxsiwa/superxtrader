from __future__ import annotations

import math
from typing import Dict
from sqlalchemy.orm import Session

from app.models.all_models import Portfolio, Position, Stock
from app.modules.ledger.accounting import get_or_create_portfolio


def get_portfolio_summary(db: Session, user_id: int, price_fetcher=None) -> Dict:
    portfolio = get_or_create_portfolio(db, user_id)

    if price_fetcher is None:
        from app.data import get_current_price_with_fallback
        price_fetcher = get_current_price_with_fallback

    quote_symbols = {
        stock.symbol.removesuffix(".BK").upper(): stock.symbol
        for stock in db.query(Stock).filter(Stock.is_active.is_(True)).all()
        if stock.symbol and stock.symbol.upper().endswith(".BK")
    }

    positions_data = []
    holdings_data = []
    total_market_value = 0.0
    total_cost_basis = 0.0
    total_unrealized_pnl = 0.0
    has_unpriced = False

    for pos in sorted(portfolio.positions, key=lambda p: p.symbol or ""):
        if pos.quantity <= 0:
            continue
        symbol = (pos.symbol or "").strip().upper()
        quote_symbol = quote_symbols.get(symbol.removesuffix(".BK"))
        curr_price = price_fetcher(quote_symbol) if quote_symbol else None

        if curr_price is not None and (not math.isfinite(curr_price) or curr_price <= 0):
            curr_price = None

        total_cost = pos.total_cost_amount or round(pos.average_cost * pos.quantity, 2)
        total_cost_basis += total_cost

        if curr_price is None:
            market_val = None
            unrealized = None
            unrealized_pct = None
            has_unpriced = True
        else:
            market_val = round(curr_price * pos.quantity, 2)
            unrealized = round((curr_price - pos.average_cost) * pos.quantity, 2)
            unrealized_pct = round((unrealized / total_cost) * 100, 2) if total_cost > 0 else 0.0
            total_market_value += market_val
            total_unrealized_pnl += unrealized

        positions_data.append({
            "symbol": symbol,
            "quantity": pos.quantity,
            "avg_price": round(pos.average_cost, 2),
            "price": round(curr_price, 2) if curr_price is not None else None,
            "market_value": market_val,
            "unrealized_pnl": unrealized,
            "price_available": curr_price is not None,
        })

        holdings_data.append({
            "symbol": symbol,
            "total_qty": pos.quantity,
            "quantity": pos.quantity,
            "avg_cost_per_share": round(pos.average_cost, 4),
            "avg_price": round(pos.average_cost, 2),
            "total_cost_amount": round(total_cost, 2),
            "current_price": round(curr_price, 2) if curr_price is not None else None,
            "price": round(curr_price, 2) if curr_price is not None else None,
            "market_value": market_val,
            "unrealized_pl": unrealized,
            "unrealized_pl_pct": unrealized_pct,
            "stop_loss_price": pos.stop_loss_price,
            "take_profit_price": pos.take_profit_price,
            "price_available": curr_price is not None,
        })

    total_realized_pnl = sum(
        t.realized_pl or 0.0 for t in portfolio.transactions if t.side == "SELL"
    )

    transactions_data = [
        {
            "order_id": t.order_id,
            "symbol": t.symbol,
            "action": t.side,
            "side": t.side,
            "order_type": t.order_type or "LIMIT",
            "status": t.status or "FILLED",
            "quantity": t.quantity,
            "price": t.price,
            "commission": t.commission or 0.0,
            "vat": t.vat or 0.0,
            "net_amount": t.net_amount or round(t.price * t.quantity, 2),
            "realized_pl": t.realized_pl or 0.0,
            "strategy_tag": t.strategy_tag or "MANUAL",
            "timestamp": t.timestamp.isoformat() + "Z" if t.timestamp else "",
        }
        for t in sorted(portfolio.transactions, key=lambda x: x.timestamp, reverse=True)
    ]

    total_value = (
        round(portfolio.current_cash + total_market_value, 2)
        if not has_unpriced
        else None
    )

    return {
        "cash": round(portfolio.current_cash, 2),
        "holdings_market_value": round(total_market_value, 2) if not has_unpriced else None,
        "total_value": total_value,
        "equity": total_value or portfolio.current_cash,
        "total_cost_basis": round(total_cost_basis, 2),
        "unrealized_pnl": round(total_unrealized_pnl, 2) if not has_unpriced else None,
        "realized_pnl": round(total_realized_pnl, 2),
        "positions": positions_data,
        "holdings": holdings_data,
        "transactions": transactions_data,
    }

