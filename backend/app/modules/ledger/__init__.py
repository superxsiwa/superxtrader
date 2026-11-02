from __future__ import annotations

from typing import Dict, Optional
from sqlalchemy.orm import Session

from app.models.all_models import DailySnapshot, Portfolio
from app.modules.ledger.accounting import (
    get_or_create_portfolio,
    execute_and_record_trade,
)
from app.modules.ledger.valuation import get_portfolio_summary
from app.modules.ledger.analytics import (
    record_daily_snapshot,
    get_performance_analytics,
)


class PortfolioLedgerManager:
    """
    โมดูลที่ 5: ระบบฐานข้อมูลและจัดการพอร์ตโฟลิโอ (Portfolio & Ledger Manager)
    - Weighted Average Cost (คำนวณต้นทุนเฉลี่ยสุทธิรวม Commission และ VAT)
    - Unrealized P/L (Mark-to-Market)
    - Realized P/L จากการขายหุ้นออก
    - Performance Analytics (% Win Rate, Profit Factor, Avg Win/Loss, MDD)
    - บันทึกและดึงข้อมูล Daily Snapshots สำหรับกราฟ Equity Curve
    """

    @staticmethod
    def get_or_create_portfolio(db: Session, user_id: int) -> Portfolio:
        return get_or_create_portfolio(db, user_id)

    @classmethod
    def execute_and_record_trade(
        cls,
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
        result = execute_and_record_trade(
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
        cls.record_daily_snapshot(db, result["portfolio_id"])
        return {
            "execution": result["execution"],
            "realized_pl": result["realized_pl"],
            "portfolio": cls.get_portfolio_summary(db, user_id),
        }

    @classmethod
    def get_portfolio_summary(cls, db: Session, user_id: int, price_fetcher=None) -> Dict:
        return get_portfolio_summary(db, user_id, price_fetcher=price_fetcher)

    @classmethod
    def record_daily_snapshot(cls, db: Session, portfolio_id: int) -> Optional[DailySnapshot]:
        return record_daily_snapshot(db, portfolio_id)

    @classmethod
    def get_performance_analytics(cls, db: Session, user_id: int) -> Dict:
        return get_performance_analytics(db, user_id)


portfolio_ledger = PortfolioLedgerManager()
ledger_manager = portfolio_ledger

__all__ = ["PortfolioLedgerManager", "portfolio_ledger", "ledger_manager"]
