import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

# Connect to TimescaleDB (PostgreSQL) running via Docker
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://superx:superxpassword@localhost:5432/superxtrader",
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_schema_columns(database_engine=engine):
    with database_engine.begin() as connection:
        insp = inspect(connection)
        tables = set(insp.get_table_names())

        if "users" in tables:
            user_cols = {col["name"] for col in insp.get_columns("users")}
            if "role" not in user_cols:
                connection.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'"))

        if "transactions" in tables:
            tx_cols = {col["name"] for col in insp.get_columns("transactions")}
            if "order_id" not in tx_cols:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN order_id VARCHAR(50)"))
            if "order_type" not in tx_cols:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN order_type VARCHAR(20) DEFAULT 'LIMIT'"))
            if "status" not in tx_cols:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN status VARCHAR(20) DEFAULT 'FILLED'"))
            if "commission" not in tx_cols:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN commission FLOAT DEFAULT 0.0"))
            if "vat" not in tx_cols:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN vat FLOAT DEFAULT 0.0"))
            if "net_amount" not in tx_cols:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN net_amount FLOAT DEFAULT 0.0"))
            if "realized_pl" not in tx_cols:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN realized_pl FLOAT DEFAULT 0.0"))
            if "strategy_tag" not in tx_cols:
                connection.execute(text("ALTER TABLE transactions ADD COLUMN strategy_tag VARCHAR(50) DEFAULT 'MANUAL'"))

        if "positions" in tables:
            pos_cols = {col["name"] for col in insp.get_columns("positions")}
            if "total_cost_amount" not in pos_cols:
                connection.execute(text("ALTER TABLE positions ADD COLUMN total_cost_amount FLOAT DEFAULT 0.0"))
            if "stop_loss_price" not in pos_cols:
                connection.execute(text("ALTER TABLE positions ADD COLUMN stop_loss_price FLOAT"))
            if "take_profit_price" not in pos_cols:
                connection.execute(text("ALTER TABLE positions ADD COLUMN take_profit_price FLOAT"))

        if "watchlists" in tables:
            wl_cols = {col["name"] for col in insp.get_columns("watchlists")}
            if "last_price" not in wl_cols:
                connection.execute(text("ALTER TABLE watchlists ADD COLUMN last_price FLOAT"))
            if "signal_status" not in wl_cols:
                connection.execute(text("ALTER TABLE watchlists ADD COLUMN signal_status VARCHAR(20)"))
            if "target_entry" not in wl_cols:
                connection.execute(text("ALTER TABLE watchlists ADD COLUMN target_entry FLOAT"))
            if "stop_loss" not in wl_cols:
                connection.execute(text("ALTER TABLE watchlists ADD COLUMN stop_loss FLOAT"))
            if "take_profit" not in wl_cols:
                connection.execute(text("ALTER TABLE watchlists ADD COLUMN take_profit FLOAT"))
            if "updated_at" not in wl_cols:
                connection.execute(text("ALTER TABLE watchlists ADD COLUMN updated_at TIMESTAMP"))


def ensure_user_role_column(database_engine=engine):
    ensure_schema_columns(database_engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
