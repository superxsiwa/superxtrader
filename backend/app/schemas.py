from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, Any, List


class TradeRequest(BaseModel):
    symbol: str = Field(..., min_length=2, max_length=15)
    action: Literal["BUY", "SELL"]
    quantity: int = Field(..., gt=0)
    price: Optional[float] = None
    strategy_tag: Optional[str] = "MANUAL"
    stop_loss_price: Optional[float] = None
    take_profit_price: Optional[float] = None
    order_type: Optional[str] = "LIMIT"


class TradeResponse(BaseModel):
    ok: bool
    message: str
    position: Any
    portfolio: dict
    execution: Optional[dict] = None


class PositionSizingRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=15)
    entry_price: Optional[float] = None
    stop_loss_price: Optional[float] = None
    take_profit_price: Optional[float] = None
    risk_pct_per_trade: Optional[float] = Field(0.01, ge=0.001, le=0.1)


class PositionSizingResponse(BaseModel):
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


class IndicatorsSchema(BaseModel):
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


class StockSignal(BaseModel):
    symbol: str
    name: str
    price: float
    change_pct: float
    rsi: float
    macd: float
    ema50: float
    ema90: float
    volume_ratio: float
    action_zone: str
    recommendation: str
    score: int
    confidence: int
    strategy_name: Optional[str] = None
    suggested_stop_loss: Optional[float] = None
    suggested_take_profit: Optional[float] = None
    indicators: Optional[Dict[str, Any]] = None


class StockCreate(BaseModel):
    symbol: str = Field(..., min_length=2, max_length=20)
    name: Optional[str] = None
    is_active: bool = True


class StockResponse(BaseModel):
    id: int
    symbol: str
    name: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class ConfigUpdate(BaseModel):
    key: str = Field(..., min_length=1, max_length=100)
    value: int = Field(..., ge=1)


class WatchlistCreate(BaseModel):
    symbol: str = Field(..., min_length=2, max_length=20)


class LineNotificationUpdate(BaseModel):
    line_user_id: str = Field(..., pattern=r"^U[0-9a-fA-F]{32}$")
    channel_access_token: Optional[str] = Field(None, min_length=1)
