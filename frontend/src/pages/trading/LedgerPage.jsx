export function LedgerPage({
  portfolio,
  portfolioAnalytics,
  accessToken,
  setAuthOpen,
  money,
  portfolioMoney,
  portfolioPnlClass,
  i18n,
  t,
}) {
  if (!accessToken) {
    return (
      <section aria-labelledby="portfolio-access-title" className="panel access-panel">
        <h2 id="portfolio-access-title">{t('navigation.module5_ledger')}</h2>
        <p>{t('market.signInToView')}</p>
        <button className="button button-primary" onClick={() => setAuthOpen(true)} type="button">
          {t('actions.signIn')}
        </button>
      </section>
    )
  }

  return (
    <>
      <section className="metrics portfolio-metrics" aria-label={t('portfolio.title')}>
        <div className="metric">
          <span>{t('market.portfolioValue')}</span>
          <strong>{portfolio ? portfolioMoney(portfolio.total_value) : '-'}</strong>
          <small>{t('market.accountValue')}</small>
        </div>
        <div className="metric">
          <span>{t('market.availableCash')}</span>
          <strong>{portfolio ? money.format(portfolio.cash) : '-'}</strong>
          <small>{t('market.paperBalance')}</small>
        </div>
        <div className="metric">
          <span>{t('portfolio.unrealizedPnl')}</span>
          <strong className={portfolioPnlClass(portfolio?.unrealized_pnl)}>
            {portfolio ? portfolioMoney(portfolio.unrealized_pnl) : '-'}
          </strong>
          <small>{t('portfolio.title')}</small>
        </div>
        <div className="metric">
          <span>{t('modules.realizedPnl')}</span>
          <strong className={portfolioPnlClass(portfolio?.realized_pnl)}>
            {portfolio ? money.format(portfolio.realized_pnl || 0) : '-'}
          </strong>
          <small>กำไรสะสมจากการปิดคำสั่ง</small>
        </div>
      </section>

      {/* Portfolio Performance Analytics Card */}
      {portfolioAnalytics?.summary && (
        <section className="panel backtest-panel" style={{ marginBottom: '16px' }}>
          <div className="panel-heading table-heading">
            <div>
              <p className="eyebrow">{t('modules.portfolioPerformance')}</p>
              <h2>การวัดผลประสิทธิภาพพอร์ต (Performance Analytics)</h2>
            </div>
            <span className="table-count">{portfolioAnalytics.summary.closed_trades} ไม้</span>
          </div>
          <div className="metrics backtest-metrics" aria-label={t('modules.portfolioPerformance')}>
            <div className="metric">
              <span>{t('backtesting.winRate')}</span>
              <strong>{portfolioAnalytics.summary.win_rate_pct.toFixed(1)}%</strong>
              <small>
                ชนะ {portfolioAnalytics.summary.winning_trades} / แพ้ {portfolioAnalytics.summary.losing_trades}
              </small>
            </div>
            <div className="metric">
              <span>{t('modules.profitFactor')}</span>
              <strong>{portfolioAnalytics.summary.profit_factor.toFixed(2)}</strong>
              <small>
                กำไร {money.format(portfolioAnalytics.summary.total_gain)} / ขาดทุน {money.format(portfolioAnalytics.summary.total_loss)}
              </small>
            </div>
            <div className="metric">
              <span>{t('modules.avgWin')}</span>
              <strong>{money.format(portfolioAnalytics.summary.avg_win)}</strong>
              <small>{t('modules.avgLoss')}: {money.format(portfolioAnalytics.summary.avg_loss)}</small>
            </div>
            <div className="metric">
              <span>Max Drawdown</span>
              <strong>{portfolioAnalytics.summary.max_drawdown_pct.toFixed(2)}%</strong>
              <small>จุดลดลงสูงสุด</small>
            </div>
          </div>
        </section>
      )}

      {/* Portfolio Holdings */}
      <section aria-labelledby="portfolio-positions-title" className="panel table-panel" style={{ marginBottom: '16px' }}>
        <div className="panel-heading table-heading">
          <div>
            <p className="eyebrow">Portfolio Holdings</p>
            <h2 id="portfolio-positions-title">สถานะหุ้นที่ถือครองในพอร์ตปัจจุบัน</h2>
          </div>
        </div>
        {portfolio?.positions.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ชื่อย่อหุ้น</th>
                  <th>จำนวนหุ้น</th>
                  <th>ต้นทุนเฉลี่ยสุทธิ (รวมคอมฯ+VAT)</th>
                  <th>ต้นทุนรวม</th>
                  <th>ราคาตลาดปัจจุบัน</th>
                  <th>มูลค่าตลาด</th>
                  <th>กำไร/ขาดทุนค้างอยู่ (Unrealized)</th>
                  <th>จุด Stop Loss</th>
                </tr>
              </thead>
              <tbody>
                {(portfolio.holdings || portfolio.positions).map((position) => (
                  <tr key={position.symbol}>
                    <td><strong>{position.symbol}</strong></td>
                    <td>{position.quantity || position.total_qty}</td>
                    <td>{portfolioMoney(position.avg_cost_per_share || position.avg_price)}</td>
                    <td>{position.total_cost_amount ? money.format(position.total_cost_amount) : '-'}</td>
                    <td>{portfolioMoney(position.current_price || position.price)}</td>
                    <td>{portfolioMoney(position.market_value)}</td>
                    <td className={portfolioPnlClass(position.unrealized_pl ?? position.unrealized_pnl)}>
                      {portfolioMoney(position.unrealized_pl ?? position.unrealized_pnl)}
                      {position.unrealized_pl_pct !== undefined && position.unrealized_pl_pct !== null && (
                        <small style={{ display: 'block', fontSize: '0.72rem' }}>
                          ({position.unrealized_pl_pct >= 0 ? '+' : ''}{position.unrealized_pl_pct.toFixed(2)}%)
                        </small>
                      )}
                    </td>
                    <td style={{ color: '#d9534f' }}>
                      {position.stop_loss_price ? money.format(position.stop_loss_price) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="table-empty">{t('portfolio.empty')}</p>
        )}
      </section>

      {/* Transactions Ledger */}
      <section aria-labelledby="portfolio-transactions-title" className="panel table-panel">
        <div className="panel-heading table-heading">
          <div>
            <p className="eyebrow">Transactions Ledger</p>
            <h2 id="portfolio-transactions-title">สมุดบัญชีประวัติการซื้อ-ขายทุกไม้</h2>
          </div>
          <span className="table-count">{portfolio?.transactions.length || 0}</span>
        </div>
        {portfolio?.transactions.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>ชื่อย่อหุ้น</th>
                  <th>คำสั่ง</th>
                  <th>จำนวนหุ้น</th>
                  <th>ราคา</th>
                  <th>ค่าคอมฯ + VAT</th>
                  <th>ยอดสุทธิ</th>
                  <th>กำไรรับรู้ (Realized P/L)</th>
                  <th>วันที่บันทึก</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.transactions.map((transaction, index) => (
                  <tr key={transaction.order_id || `${transaction.timestamp}-${transaction.symbol}-${index}`}>
                    <td><code style={{ fontSize: '0.72rem' }}>{transaction.order_id || '-'}</code></td>
                    <td><strong>{transaction.symbol}</strong></td>
                    <td>
                      <span className={`signal-tag ${(transaction.action || transaction.side).toLowerCase()}`}>
                        {t((transaction.action || transaction.side) === 'BUY' ? 'trade.buy' : 'trade.sell')}
                      </span>
                    </td>
                    <td>{transaction.quantity}</td>
                    <td>{portfolioMoney(transaction.price)}</td>
                    <td>{money.format((transaction.commission || 0) + (transaction.vat || 0))}</td>
                    <td>{money.format(transaction.net_amount || (transaction.price * transaction.quantity))}</td>
                    <td className={portfolioPnlClass(transaction.realized_pl)}>
                      {transaction.side === 'SELL' ? money.format(transaction.realized_pl || 0) : '-'}
                    </td>
                    <td>{transaction.timestamp ? new Date(transaction.timestamp).toLocaleString(i18n.language === 'th' ? 'th-TH' : 'en-US') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="table-empty">{t('portfolio.noTransactions')}</p>
        )}
      </section>
    </>
  )
}

