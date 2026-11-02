import unittest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.all_models import Portfolio, Position, Stock, Transaction, User
from app.modules.ingestion import MarketDataIngestion, NormalizedOHLCV
from app.modules.analysis import (
    SignalAnalysisEngine,
    calculate_ema,
    calculate_rsi,
    calculate_macd,
    calculate_atr,
    calculate_bollinger_bands,
    calculate_stochastic,
)
from app.modules.risk import RiskPositionSizer
from app.modules.execution import ExecutionEngine
from app.modules.ledger import PortfolioLedgerManager


class EndToEndArchitectureModulesTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        self.user = User(email="trader@example.com", password_hash="hash")
        self.db.add(self.user)
        self.db.commit()

        self.portfolio = Portfolio(
            user_id=self.user.id,
            initial_balance=250000.0,
            current_cash=250000.0,
        )
        self.db.add(self.portfolio)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    # --- โมดูลที่ 1: Market Data Ingestion ---
    def test_module_1_normalized_ohlcv(self):
        ingestion = MarketDataIngestion()
        self.assertEqual(ingestion.get_standardized_symbol("AOT"), "AOT.BK")
        self.assertEqual(ingestion.clean_symbol("AOT.BK"), "AOT")

        item = NormalizedOHLCV(
            symbol="AOT",
            market="SET",
            timeframe="1D",
            timestamp="2026-11-02T16:30:00+07:00",
            open=61.50,
            high=62.25,
            low=61.25,
            close=62.00,
            volume=18500000,
        )
        self.assertEqual(item.symbol, "AOT")
        self.assertEqual(item.close, 62.00)

    # --- โมดูลที่ 2: Signal & Analysis Engine ---
    def test_module_2_indicators_and_signal(self):
        closes = [50.0 + (i * 0.5) for i in range(60)]
        highs = [c + 1.0 for c in closes]
        lows = [c - 1.0 for c in closes]
        volumes = [1000000] * 59 + [2500000]  # volume spike

        history = [
            {"date": f"2026-01-{i+1:02d}", "open": closes[i], "high": highs[i], "low": lows[i], "close": closes[i], "volume": volumes[i]}
            for i in range(60)
        ]

        engine = SignalAnalysisEngine()
        sig = engine.analyze_history("AOT", history)

        self.assertEqual(sig.symbol, "AOT")
        self.assertIn(sig.signal_type, ["BUY_SIGNAL", "SELL_SIGNAL", "WATCH"])
        self.assertGreater(sig.suggested_stop_loss, 0)
        self.assertGreater(sig.suggested_take_profit, sig.entry_price)
        self.assertIsNotNone(sig.indicators.ema20)
        self.assertIsNotNone(sig.indicators.atr14)
        self.assertIsNotNone(sig.indicators.volume_ratio)

    # --- โมดูลที่ 3: Risk & Position Sizing ---
    def test_module_3_position_sizing_formula(self):
        sizer = RiskPositionSizer()
        # Equity: 250,000 THB, Risk 1% = 2,500 THB
        # Entry: 62.00, Stop Loss: 60.00 -> Risk per share: 2.00 THB
        # Raw qty: 2500 / 2.00 = 1250 -> Board lot 100 round down: 1200 shares!
        plan = sizer.calculate_sizing(
            symbol="AOT",
            entry_price=62.00,
            stop_loss_price=60.00,
            portfolio_equity=250000.0,
            available_cash=250000.0,
            risk_pct_per_trade=0.01,
            take_profit_price=66.00,
        )

        self.assertEqual(plan.max_risk_baht, 2500.00)
        self.assertEqual(plan.risk_per_share, 2.00)
        self.assertEqual(plan.recommended_qty, 1200)
        self.assertEqual(plan.estimated_gross_cost, 74400.00)
        self.assertEqual(plan.risk_reward_ratio, 2.0)

    # --- โมดูลที่ 4: Notification & Execution ---
    def test_module_4_execution_fees_and_order(self):
        engine = ExecutionEngine()
        gross, comm, vat, net = engine.calculate_settlement("BUY", 1200, 62.00)
        self.assertEqual(gross, 74400.00)
        self.assertEqual(comm, 116.81)  # 74400 * 0.00157 = 116.808 -> 116.81
        self.assertEqual(vat, 8.18)     # 116.81 * 0.07 = 8.1767 -> 8.18
        self.assertEqual(net, 74524.99) # 74400 + 116.81 + 8.18 = 74524.99

        report = engine.execute_order("AOT", "BUY", 1200, 62.00)
        self.assertTrue(report.order_id.startswith("ORD-"))
        self.assertEqual(report.status, "FILLED")
        self.assertEqual(report.net_settlement, 74524.99)

    # --- โมดูลที่ 5: Portfolio & Ledger Manager ---
    def test_module_5_weighted_average_cost_and_realized_pl(self):
        mgr = PortfolioLedgerManager()

        # 1. Buy 1,000 shares @ 50.00
        res1 = mgr.execute_and_record_trade(
            db=self.db,
            user_id=self.user.id,
            symbol="AOT",
            action="BUY",
            quantity=1000,
            price=50.00,
            strategy_tag="Breakout_Volume_Spike",
        )
        pos = self.db.query(Position).filter_by(symbol="AOT").first()
        self.assertEqual(pos.quantity, 1000)
        # Net buy cost = 50,000 + comm(78.50) + vat(5.50) = 50084.00
        self.assertAlmostEqual(pos.total_cost_amount, 50084.00, places=1)
        self.assertAlmostEqual(pos.average_cost, 50.084, places=2)

        # 2. Buy another 500 shares @ 55.00
        res2 = mgr.execute_and_record_trade(
            db=self.db,
            user_id=self.user.id,
            symbol="AOT",
            action="BUY",
            quantity=500,
            price=55.00,
        )
        pos = self.db.query(Position).filter_by(symbol="AOT").first()
        self.assertEqual(pos.quantity, 1500)
        # Weighted average cost per share updated
        self.assertGreater(pos.average_cost, 50.084)

        # 3. Sell 500 shares @ 60.00 (with profit)
        res3 = mgr.execute_and_record_trade(
            db=self.db,
            user_id=self.user.id,
            symbol="AOT",
            action="SELL",
            quantity=500,
            price=60.00,
        )
        self.assertGreater(res3["realized_pl"], 0)
        pos = self.db.query(Position).filter_by(symbol="AOT").first()
        self.assertEqual(pos.quantity, 1000)

        # 4. Check Analytics
        analytics = mgr.get_performance_analytics(self.db, self.user.id)
        self.assertEqual(analytics["summary"]["closed_trades"], 1)
        self.assertEqual(analytics["summary"]["winning_trades"], 1)
        self.assertEqual(analytics["summary"]["win_rate_pct"], 100.0)
        self.assertGreater(len(analytics["equity_curve"]), 0)


if __name__ == "__main__":
    unittest.main()

