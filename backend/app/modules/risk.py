from __future__ import annotations

import math
from typing import Optional
from pydantic import BaseModel, Field


class PositionSizingPlan(BaseModel):
    symbol: str
    portfolio_equity: float
    available_cash: float
    risk_pct_per_trade: float
    max_risk_baht: float
    entry_price: float
    stop_loss_price: float
    take_profit_price: float
    risk_per_share: float
    recommended_qty: int
    estimated_gross_cost: float
    risk_reward_ratio: float


class RiskPositionSizer:
    """
    โมดูลที่ 3: ระบบคำนวณความเสี่ยงและขนาดไม้ (Risk & Position Sizing)
    ใช้หลักการ Fixed Fractional Position Sizing เพื่อจำกัดความเสี่ยงต่อไม้
    และปัดเศษจำนวนหุ้นเป็น Board Lot ของหุ้นไทย (ทวีคูณ 100 หุ้น)
    """

    @staticmethod
    def calculate_sizing(
        symbol: str,
        entry_price: float,
        stop_loss_price: float,
        portfolio_equity: float,
        available_cash: float,
        risk_pct_per_trade: float = 0.01,
        take_profit_price: Optional[float] = None,
    ) -> PositionSizingPlan:
        if entry_price <= 0:
            raise ValueError("Entry price must be greater than zero")

        # ป้องกันกรณี Stop Loss สูงกว่าหรือเท่ากับ Entry Price สำหรับฝั่ง BUY
        if stop_loss_price >= entry_price:
            stop_loss_price = round(entry_price * 0.95, 2)

        risk_per_share = round(max(0.01, entry_price - stop_loss_price), 2)

        # หากไม่ได้ระบุ take_profit_price ให้ใช้ Risk/Reward = 2.0
        if take_profit_price is None or take_profit_price <= entry_price:
            take_profit_price = round(entry_price + (2.0 * risk_per_share), 2)

        # 1. คำนวณเงินที่ยอมเสียได้สูงสุดต่อไม้ (Max Risk Baht)
        max_risk_baht = round(portfolio_equity * risk_pct_per_trade, 2)

        # 2. จำนวนหุ้นตามความเสี่ยง (ปัดเศษลงหลัก 100 หุ้น - Board Lot)
        raw_qty = math.floor(max_risk_baht / risk_per_share)
        recommended_qty = (raw_qty // 100) * 100

        # 3. ตรวจสอบเงินสดคงเหลือ (Available Cash Constraint)
        max_cash_shares = math.floor(available_cash / entry_price)
        max_cash_board_lot = (max_cash_shares // 100) * 100
        recommended_qty = min(recommended_qty, max(0, max_cash_board_lot))

        estimated_gross_cost = round(recommended_qty * entry_price, 2)
        profit_per_share = max(0.01, take_profit_price - entry_price)
        risk_reward_ratio = round(profit_per_share / risk_per_share, 2)

        return PositionSizingPlan(
            symbol=symbol.strip().upper().removesuffix(".BK"),
            portfolio_equity=round(portfolio_equity, 2),
            available_cash=round(available_cash, 2),
            risk_pct_per_trade=risk_pct_per_trade,
            max_risk_baht=max_risk_baht,
            entry_price=round(entry_price, 2),
            stop_loss_price=round(stop_loss_price, 2),
            take_profit_price=round(take_profit_price, 2),
            risk_per_share=risk_per_share,
            recommended_qty=recommended_qty,
            estimated_gross_cost=estimated_gross_cost,
            risk_reward_ratio=risk_reward_ratio,
        )


risk_sizer = RiskPositionSizer()

