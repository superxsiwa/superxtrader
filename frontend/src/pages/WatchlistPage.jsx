export function WatchlistPage({
  watchlistSymbols,
  watchlistInput,
  setWatchlistInput,
  watchlistBusy,
  watchlistMessage,
  addWatchlistSymbol,
  removeWatchlistSymbol,
  stocks,
  selectStockForRisk,
  setTradeSymbol,
  setAction,
  navigateToPage,
  accessToken,
  setAuthOpen,
  money,
  t,
}) {
  return (
    <div className="module-page">
      <div className="module-banner">
        <span className="module-tag">MONITOR</span>
        <h2>{t('navigation.watchlist')}</h2>
        <p>ติดตามและเฝ้าระวังหุ้นรายตัวที่คุณสนใจ ตรวจจับราคาล่าสุด สัญญาณเทคนิค และส่งต่อคำนวณขนาดไม้ หรือส่งคำสั่งซื้อขายได้ทันที</p>
      </div>

      {accessToken ? (
        <>
          <article className="panel" style={{ marginBottom: '1.5rem' }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t('watchlist.eyebrow')}</p>
                <h2>เพิ่มหุ้นเข้าสู่รายการเฝ้าระวัง</h2>
              </div>
            </div>
            <form
              className="feature-form watchlist-form"
              onSubmit={addWatchlistSymbol}
              style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
            >
              <label style={{ flex: '1', minWidth: '220px' }}>
                {t('watchlist.symbol')}
                <input
                  autoCapitalize="characters"
                  maxLength="20"
                  onChange={(event) => setWatchlistInput(event.target.value)}
                  placeholder="e.g. CPALL.BK, PTT.BK"
                  required
                  value={watchlistInput}
                />
              </label>
              <button className="button button-primary" disabled={watchlistBusy} type="submit">
                {watchlistBusy ? 'กำลังเพิ่ม...' : t('watchlist.add')}
              </button>
            </form>
            {watchlistMessage && (
              <p className="form-message" role="status" style={{ marginTop: '0.75rem' }}>
                {watchlistMessage}
              </p>
            )}
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">WATCHLIST STOCKS</p>
                <h2>รายการหุ้นที่กำลังเฝ้าระวัง ({watchlistSymbols.length})</h2>
              </div>
            </div>
            {watchlistSymbols.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('table.symbol')}</th>
                      <th>{t('table.price')}</th>
                      <th>{t('table.change')}</th>
                      <th>{t('table.signal')}</th>
                      <th>SL / TP อ้างอิง</th>
                      <th style={{ textAlign: 'right' }}>ดำเนินการ (Actions)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlistSymbols.map((symbol) => {
                      const stockInfo = stocks.find((s) => s.symbol === symbol)
                      const price = stockInfo?.price ? money.format(stockInfo.price) : '-'
                      const change = stockInfo?.change_pct !== undefined
                        ? `${stockInfo.change_pct >= 0 ? '+' : ''}${stockInfo.change_pct.toFixed(2)}%`
                        : '-'
                      const rec = stockInfo?.recommendation || 'WATCH'
                      const sl = stockInfo?.suggested_stop_loss ? money.format(stockInfo.suggested_stop_loss) : '-'
                      const tp = stockInfo?.suggested_take_profit ? money.format(stockInfo.suggested_take_profit) : '-'
                      return (
                        <tr key={symbol}>
                          <td><strong>{symbol}</strong></td>
                          <td>{price}</td>
                          <td className={stockInfo?.change_pct >= 0 ? 'text-success' : 'text-danger'}>{change}</td>
                          <td>
                            <span className={`signal-tag ${rec.toLowerCase()}`}>{t(`signals.${rec}`)}</span>
                          </td>
                          <td>
                            <small>SL: {sl} | TP: {tp}</small>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button
                                className="button button-quiet"
                                onClick={() => {
                                  selectStockForRisk(stockInfo || { symbol, price: stockInfo?.price || 50 })
                                  navigateToPage('module3_risk')
                                }}
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                type="button"
                              >
                                คำนวณขนาดไม้
                              </button>
                              <button
                                className="button button-quiet"
                                onClick={() => {
                                  setTradeSymbol(symbol)
                                  setAction(rec === 'SELL' ? 'SELL' : 'BUY')
                                  navigateToPage('module4_execution')
                                }}
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                type="button"
                              >
                                ส่งคำสั่ง
                              </button>
                              <button
                                className="text-button"
                                disabled={watchlistBusy}
                                onClick={() => removeWatchlistSymbol(symbol)}
                                style={{ color: '#d9534f', fontSize: '0.85rem' }}
                                type="button"
                              >
                                {t('watchlist.remove')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-empty" style={{ padding: '3rem 1rem' }}>
                <p>{t('watchlist.empty')}</p>
                <small>คุณสามารถเพิ่มหุ้นที่ต้องการเฝ้าดูได้จากฟอร์มด้านบน หรือคลิกปุ่มบันทึกในตารางสแกนหุ้น</small>
              </div>
            )}
          </article>
        </>
      ) : (
        <section className="auth-required">
          <p>{t('market.signInToView')}</p>
          <button className="button button-primary" onClick={() => setAuthOpen(true)} type="button">
            {t('actions.signIn')}
          </button>
        </section>
      )}
    </div>
  )
}

