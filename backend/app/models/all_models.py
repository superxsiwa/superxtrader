from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Date, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Stock(Base):
    __tablename__ = "stocks"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String)
    is_active = Column(Boolean, default=True)

class SystemConfig(Base):
    __tablename__ = "system_config"
    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String(20), nullable=False, default="user", server_default="user")
    
    portfolios = relationship("Portfolio", back_populates="owner")

class Watchlist(Base):
    __tablename__ = "watchlists"
    __table_args__ = (UniqueConstraint("user_id", "symbol", name="uq_watchlist_user_symbol"),)
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    last_price = Column(Float, nullable=True)
    signal_status = Column(String(20), nullable=True)
    target_entry = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserNotificationSettings(Base):
    __tablename__ = "user_notification_settings"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    line_user_id = Column(String, nullable=False)
    encrypted_channel_access_token = Column(String, nullable=False)

class SignalHistory(Base):
    __tablename__ = "signal_history"
    __table_args__ = (UniqueConstraint("symbol", "signal_date", name="uq_signal_history_symbol_date"),)
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    recommendation = Column(String(20), nullable=False)
    price = Column(Float, nullable=False)
    signal_date = Column(Date, nullable=False, index=True)

class Portfolio(Base):
    __tablename__ = "portfolios"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    initial_balance = Column(Float, default=250000.0)
    current_cash = Column(Float, default=250000.0)
    
    owner = relationship("User", back_populates="portfolios")
    positions = relationship("Position", back_populates="portfolio", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="portfolio", cascade="all, delete-orphan")
    daily_snapshots = relationship("DailySnapshot", back_populates="portfolio", cascade="all, delete-orphan")

class Position(Base):
    __tablename__ = "positions"
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    symbol = Column(String, index=True)
    average_cost = Column(Float)
    quantity = Column(Integer)
    total_cost_amount = Column(Float, default=0.0)
    stop_loss_price = Column(Float, nullable=True)
    take_profit_price = Column(Float, nullable=True)
    
    portfolio = relationship("Portfolio", back_populates="positions")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    order_id = Column(String(50), index=True, nullable=True)
    symbol = Column(String, index=True)
    side = Column(String) # BUY or SELL
    order_type = Column(String(20), default="LIMIT")
    status = Column(String(20), default="FILLED")
    price = Column(Float)
    quantity = Column(Integer)
    commission = Column(Float, default=0.0)
    vat = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    realized_pl = Column(Float, default=0.0)
    strategy_tag = Column(String(50), default="MANUAL")
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    portfolio = relationship("Portfolio", back_populates="transactions")

class DailySnapshot(Base):
    __tablename__ = "daily_snapshots"
    __table_args__ = (UniqueConstraint("portfolio_id", "snapshot_date", name="uq_snapshot_portfolio_date"),)
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    cash_balance = Column(Float, nullable=False)
    holdings_market_value = Column(Float, nullable=False)
    total_equity = Column(Float, nullable=False)
    daily_pl = Column(Float, default=0.0)
    daily_return_pct = Column(Float, default=0.0)
    drawdown_pct = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    portfolio = relationship("Portfolio", back_populates="daily_snapshots")
