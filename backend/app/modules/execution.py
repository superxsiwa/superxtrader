from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel

from app.line_messaging import send_line_message


class ExecutionReport(BaseModel):
    order_id: str
    symbol: str
    side: str
    order_type: str = "LIMIT"
    status: str = "FILLED"
    filled_qty: int
    filled_price: float
    gross_amount: float
    commission: float
    vat: float
    net_settlement: float
    executed_at: str


class ExecutionEngine:
    """
    โมดูลที่ 4: ระบบแจ้งเตือนและส่งคำสั่งซื้อขาย (Notification & Execution)
    รองรับทั้ง Semi-Auto (ส่งสัญญาณแจ้งเตือน LINE/Telegram)
    และระบบคำนวณค่าธรรมเนียมจริง (Commission 0.157% + VAT 7%) เพื่อจับคู่คำสั่ง
    """

    COMMISSION_RATE: float = 0.00157  # อัตราค่าคอมมิชชันหุ้นไทยออนไลน์ทั่วไป 0.157%
    VAT_RATE: float = 0.07  # VAT 7% ของค่าคอมมิชชัน

    @staticmethod
    def generate_order_id() -> str:
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        short_id = uuid.uuid4().hex[:6].upper()
        return f"ORD-{date_str}-{short_id}"

    @classmethod
    def calculate_settlement(
        cls, side: str, quantity: int, price: float
    ) -> tuple[float, float, float, float]:
        """
        คำนวณ Gross, Commission, VAT, และ Net Settlement
        คืนค่า: (gross_amount, commission, vat, net_settlement)
        """
        gross_amount = round(quantity * price, 2)
        commission = round(gross_amount * cls.COMMISSION_RATE, 2)
        vat = round(commission * cls.VAT_RATE, 2)

        if side.upper() == "BUY":
            net_settlement = round(gross_amount + commission + vat, 2)
        else:
            net_settlement = round(gross_amount - commission - vat, 2)

        return gross_amount, commission, vat, net_settlement

    @classmethod
    def execute_order(
        cls,
        symbol: str,
        side: str,
        quantity: int,
        price: float,
        order_type: str = "LIMIT",
        order_id: Optional[str] = None,
    ) -> ExecutionReport:
        clean_sym = symbol.strip().upper().removesuffix(".BK")
        order_id = order_id or cls.generate_order_id()
        gross, comm, vat, net = cls.calculate_settlement(side, quantity, price)
        now_iso = datetime.now(timezone.utc).isoformat()

        return ExecutionReport(
            order_id=order_id,
            symbol=clean_sym,
            side=side.upper(),
            order_type=order_type,
            status="FILLED",
            filled_qty=quantity,
            filled_price=round(price, 2),
            gross_amount=gross,
            commission=comm,
            vat=vat,
            net_settlement=net,
            executed_at=now_iso,
        )

    @staticmethod
    def send_trade_signal_alert(
        line_user_id: str,
        channel_access_token: str,
        symbol: str,
        signal_type: str,
        strategy_name: str,
        entry_price: float,
        stop_loss: float,
        take_profit: float,
        recommended_qty: Optional[int] = None,
        risk_reward_ratio: Optional[float] = None,
    ) -> bool:
        """
        ส่งสัญญาณแจ้งเตือนการเทรดผ่าน LINE Messaging API
        """
        clean_sym = symbol.strip().upper().removesuffix(".BK")
        action_emoji = "🟢 เข้าซื้อ (BUY)" if "BUY" in signal_type.upper() else "🔴 ขายทำกำไร/คัท (SELL)"
        msg_lines = [
            f"🔔 [SuperX Trader Alert]",
            f"กลยุทธ์: {strategy_name}",
            f"หุ้น: {clean_sym}",
            f"สัญญาณ: {action_emoji}",
            f"ราคาอ้างอิง: {entry_price:.2f} THB",
            f"จุดตัดขาดทุน (SL): {stop_loss:.2f} THB",
            f"เป้าหมายกำไร (TP): {take_profit:.2f} THB",
        ]
        if recommended_qty:
            msg_lines.append(f"ขนาดไม้แนะนำ (1% Risk): {recommended_qty:,} หุ้น")
        if risk_reward_ratio:
            msg_lines.append(f"R:R Ratio: {risk_reward_ratio:.1f}")

        message_text = "\n".join(msg_lines)
        try:
            send_line_message(
                channel_access_token=channel_access_token,
                line_user_id=line_user_id,
                text=message_text,
            )
            return True
        except Exception:
            return False



execution_engine = ExecutionEngine()
