from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Optional
from sqlalchemy.orm import Session

from app.models.all_models import Portfolio, Position, Transaction
from app.modules.execution import execution_engine
from app.modules.ingestion import market_ingestion


def get_or_create_portfolio(db: Session, user_id: int) -> Portfolio:
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if not portfolio:
        portfolio = Portfolio(
            user_id=user_id,
            initial_balance=250000.0,
            current_cash=250000.0,
        )
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    return portfolio


def execute_and_record_trade(
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
    clean_sym = symbol.strip().upper().removesuffix(".BK")
    portfolio = get_or_create_portfolio(db, user_id)

    if price is None or price <= 0:
        market_quote = market_ingestion.get_latest_quote(clean_sym)
        if market_quote is None or market_quote <= 0:
            raise ValueError(f"Cannot obtain current price for symbol {clean_sym}")
        price = round(market_quote, 2)

    exec_report = execution_engine.execute_order(
        symbol=clean_sym,
        side=action,
        quantity=quantity,
        price=price,
        order_type=order_type,
    )

    realized_pl = 0.0

    if action.upper() == "BUY":
        if portfolio.current_cash < exec_report.net_settlement:
            raise ValueError(
                f"Not enough cash. Required {exec_report.net_settlement:,.2f} THB, but cash is {portfolio.current_cash:,.2f} THB"
            )

        portfolio.current_cash = round(portfolio.current_cash - exec_report.net_settlement, 2)

        pos = (
            db.query(Position)
            .filter(Position.portfolio_id == portfolio.id, Position.symbol == clean_sym)
            .first()
        )
        if pos:
            prev_cost = pos.total_cost_amount or (pos.average_cost * pos.quantity)
            new_total_cost = round(prev_cost + exec_report.net_settlement, 2)
            pos.quantity += quantity
            pos.total_cost_amount = new_total_cost
            pos.average_cost = round(new_total_cost / pos.quantity, 4)
            if stop_loss_price:
                pos.stop_loss_price = stop_loss_price
            if take_profit_price:
                pos.take_profit_price = take_profit_price
        else:
            new_pos = Position(
                portfolio_id=portfolio.id,
                symbol=clean_sym,
                average_cost=round(exec_report.net_settlement / quantity, 4),
                quantity=quantity,
                total_cost_amount=exec_report.net_settlement,
                stop_loss_price=stop_loss_price,
                take_profit_price=take_profit_price,
            )
            db.add(new_pos)

    elif action.upper() == "SELL":
        pos = (
            db.query(Position)
            .filter(Position.portfolio_id == portfolio.id, Position.symbol == clean_sym)
            .first()
        )
        if not pos or pos.quantity < quantity:
            available_qty = pos.quantity if pos else 0
            raise ValueError(
                f"Not enough shares to sell. Holding: {available_qty}, Selling: {quantity}"
            )

        cost_of_sold = round(pos.average_cost * quantity, 2)
        realized_pl = round(exec_report.net_settlement - cost_of_sold, 2)

        portfolio.current_cash = round(portfolio.current_cash + exec_report.net_settlement, 2)
        pos.quantity -= quantity

        prev_total_cost = pos.total_cost_amount or (pos.average_cost * (pos.quantity + quantity))
        pos.total_cost_amount = round(max(0.0, prev_total_cost - cost_of_sold), 2)

        if pos.quantity == 0:
            db.delete(pos)
    else:
        raise ValueError(f"Unsupported side: {action}")

    transaction = Transaction(
        portfolio_id=portfolio.id,
        order_id=exec_report.order_id,
        symbol=clean_sym,
        side=exec_report.side,
        order_type=exec_report.order_type,
        status=exec_report.status,
        price=exec_report.filled_price,
        quantity=exec_report.filled_qty,
        commission=exec_report.commission,
        vat=exec_report.vat,
        net_amount=exec_report.net_settlement,
        realized_pl=realized_pl,
        strategy_tag=strategy_tag,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(transaction)
    db.commit()

    return {
        "execution": exec_report.model_dump(),
        "realized_pl": realized_pl,
        "portfolio_id": portfolio.id,
    }

