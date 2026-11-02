from __future__ import annotations

from datetime import date
from typing import Dict, Optional
from sqlalchemy.orm import Session

from app.models.all_models import DailySnapshot, Portfolio
from app.modules.ledger.accounting import get_or_create_portfolio
from app.modules.ledger.valuation import get_portfolio_summary


def record_daily_snapshot(db: Session, portfolio_id: int) -> Optional[DailySnapshot]:
    today = date.today()
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        return None

    summary = get_portfolio_summary(db, portfolio.user_id)
    cash = summary["cash"]
    market_val = summary["holdings_market_value"] or 0.0
    equity = cash + market_val

    prev_snapshot = (
        db.query(DailySnapshot)
        .filter(DailySnapshot.portfolio_id == portfolio_id, DailySnapshot.snapshot_date < today)
        .order_by(DailySnapshot.snapshot_date.desc())
        .first()
    )

    if prev_snapshot and prev_snapshot.total_equity > 0:
        daily_pl = round(equity - prev_snapshot.total_equity, 2)
        daily_return_pct = round((daily_pl / prev_snapshot.total_equity) * 100, 2)
    else:
        daily_pl = 0.0
        daily_return_pct = 0.0

    all_snapshots = (
        db.query(DailySnapshot)
        .filter(DailySnapshot.portfolio_id == portfolio_id)
        .all()
    )
    peak_equity = max([s.total_equity for s in all_snapshots] + [equity, portfolio.initial_balance])
    drawdown_pct = (
        round(((peak_equity - equity) / peak_equity) * 100, 2)
        if peak_equity > 0
        else 0.0
    )

    existing = (
        db.query(DailySnapshot)
        .filter(
            DailySnapshot.portfolio_id == portfolio_id,
            DailySnapshot.snapshot_date == today,
        )
        .first()
    )

    if existing:
        existing.cash_balance = cash
        existing.holdings_market_value = market_val
        existing.total_equity = equity
        existing.daily_pl = daily_pl
        existing.daily_return_pct = daily_return_pct
        existing.drawdown_pct = drawdown_pct
        db.commit()
        return existing

    new_snapshot = DailySnapshot(
        portfolio_id=portfolio_id,
        snapshot_date=today,
        cash_balance=cash,
        holdings_market_value=market_val,
        total_equity=equity,
        daily_pl=daily_pl,
        daily_return_pct=daily_return_pct,
        drawdown_pct=drawdown_pct,
    )
    db.add(new_snapshot)
    db.commit()
    return new_snapshot


def get_performance_analytics(db: Session, user_id: int) -> Dict:
    portfolio = get_or_create_portfolio(db, user_id)
    sell_txs = [t for t in portfolio.transactions if t.side == "SELL"]

    closed_trades = len(sell_txs)
    winning_trades = [t for t in sell_txs if (t.realized_pl or 0) > 0]
    losing_trades = [t for t in sell_txs if (t.realized_pl or 0) < 0]

    total_gain = sum(t.realized_pl for t in winning_trades)
    total_loss = abs(sum(t.realized_pl for t in losing_trades))

    win_rate = round((len(winning_trades) / closed_trades) * 100, 2) if closed_trades > 0 else 0.0
    profit_factor = (
        round(total_gain / total_loss, 2) if total_loss > 0 else (99.0 if total_gain > 0 else 1.0)
    )
    avg_win = round(total_gain / len(winning_trades), 2) if winning_trades else 0.0
    avg_loss = round(total_loss / len(losing_trades), 2) if losing_trades else 0.0

    snapshots = (
        db.query(DailySnapshot)
        .filter(DailySnapshot.portfolio_id == portfolio.id)
        .order_by(DailySnapshot.snapshot_date.asc())
        .all()
    )

    max_drawdown = max([s.drawdown_pct for s in snapshots] + [0.0])

    equity_curve = [
        {
            "date": s.snapshot_date.isoformat(),
            "equity": s.total_equity,
            "daily_pl": s.daily_pl,
            "drawdown_pct": s.drawdown_pct,
        }
        for s in snapshots
    ]

    return {
        "summary": {
            "initial_balance": portfolio.initial_balance,
            "current_cash": portfolio.current_cash,
            "closed_trades": closed_trades,
            "winning_trades": len(winning_trades),
            "losing_trades": len(losing_trades),
            "win_rate_pct": win_rate,
            "profit_factor": profit_factor,
            "total_gain": round(total_gain, 2),
            "total_loss": round(total_loss, 2),
            "avg_win": avg_win,
            "avg_loss": avg_loss,
            "max_drawdown_pct": max_drawdown,
        },
        "equity_curve": equity_curve,
    }

