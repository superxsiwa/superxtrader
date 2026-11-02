from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services import (
    scan_market,
    get_symbol_chart,
    get_portfolio_summary,
    process_trade,
    calculate_position_sizing,
)
from app.schemas import (
    TradeRequest,
    TradeResponse,
    PositionSizingRequest,
    PositionSizingResponse,
)
import redis
import json
import os

router = APIRouter(prefix="/api", tags=["Frontend"])

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
redis_client = redis.Redis.from_url(f"{redis_url}/2")

@router.get("/scan")
def api_scan_market():
    # Attempt to fetch from cache
    cached = redis_client.get("daily_scan_results")
    if cached:
        return json.loads(cached)
    
    # Fallback to direct synchronous calculation if cache is empty
    stocks = scan_market()
    return {"stocks": stocks}

@router.get("/charts/{symbol}")
def api_symbol_chart(symbol: str):
    try:
        history = get_symbol_chart(symbol)
        candles = []
        for h in history:
            candles.append({
                "date": h.get("date"),
                "open": h.get("open", h["close"]),
                "high": h.get("high", h["close"]),
                "low": h.get("low", h["close"]),
                "close": h["close"],
                "volume": h.get("volume", 0),
            })
        return {"candles": candles}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

from app.core.security import get_current_user
from app.models.all_models import User

@router.get("/portfolio")
def api_portfolio(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_portfolio_summary(db, user_id=current_user.id)

@router.post("/risk/calculate-sizing", response_model=PositionSizingResponse)
def api_calculate_sizing(
    req: PositionSizingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        plan = calculate_position_sizing(
            db=db,
            user_id=current_user.id,
            symbol=req.symbol,
            entry_price=req.entry_price,
            stop_loss_price=req.stop_loss_price,
            take_profit_price=req.take_profit_price,
            risk_pct_per_trade=req.risk_pct_per_trade or 0.01,
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/paper-trade", response_model=TradeResponse)
def api_paper_trade(trade: TradeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        portfolio = process_trade(
            db=db,
            user_id=current_user.id,
            symbol=trade.symbol,
            action=trade.action,
            quantity=trade.quantity,
            price=trade.price,
            strategy_tag=trade.strategy_tag or "MANUAL",
            stop_loss_price=trade.stop_loss_price,
            take_profit_price=trade.take_profit_price,
            order_type=trade.order_type or "LIMIT",
        )
        exec_info = portfolio.get("execution", {})
        return TradeResponse(
            ok=True,
            message=f"{trade.action} {trade.quantity:,} {trade.symbol} สำเร็จ (Net: {exec_info.get('net_settlement', 0):,.2f} THB)",
            position=portfolio.get("positions", []),
            portfolio=portfolio,
            execution=exec_info,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
