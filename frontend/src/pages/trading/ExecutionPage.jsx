export function ExecutionPage({
  tradeSymbol,
  setTradeSymbol,
  quantity,
  setQuantity,
  action,
  setAction,
  submitTrade,
  tradeMessage,
  accessToken,
  busy,
  selectedStock,
  lastExecutionReport,
  setAlertsOpen,
  sendTestNotification,
  notificationBusy,
  notificationMessage,
  money,
  t,
}) {
  const stockPrice = Number(selectedStock?.price || 0)
  const qtyNum = Number(quantity || 0)
  const grossAmount = qtyNum * stockPrice
  const commission = grossAmount * 0.00157
  const vat = commission * 0.07
  const netSettlement = action === 'BUY'
    ? grossAmount * 1.0016799
    : grossAmount * 0.9983201

  return (
    <section className="work-grid" style={{ gridTemplateColumns: 'minmax(320px, 420px) 1fr' }}>
      <article className="panel trade-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Notification & Execution</p>
            <h2>ส่งคำสั่งซื้อขาย (Order Execution)</h2>
          </div>
        </div>
        <form className="trade-form" onSubmit={submitTrade}>
          <label>
            {t('trade.symbol')}
            <input
              maxLength="10"
              onChange={(event) => setTradeSymbol(event.target.value)}
              value={tradeSymbol}
              required
            />
          </label>
          <div className="form-split">
            <label>
              {t('trade.quantity')}
              <input
                min="1"
                onChange={(event) => setQuantity(event.target.value)}
                type="number"
                value={quantity}
                required
              />
            </label>
            <label>
              {t('trade.side')}
              <select onChange={(event) => setAction(event.target.value)} value={action}>
                <option value="BUY">{t('trade.buy')}</option>
                <option value="SELL">{t('trade.sell')}</option>
              </select>
            </label>
          </div>

          {/* ค่าธรรมเนียมคำนวณอัตโนมัติ */}
          <div style={{ background: '#f8faf9', padding: '10px', borderRadius: '6px', border: '1px solid #e8edea', fontSize: '0.8rem', margin: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Gross Amount:</span>
              <strong>{money.format(grossAmount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#77817b', marginBottom: '4px' }}>
              <span>Commission (0.157%):</span>
              <span>{money.format(commission)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#77817b', marginBottom: '4px' }}>
              <span>VAT 7%:</span>
              <span>{money.format(vat)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '4px', fontWeight: 'bold' }}>
              <span>ยอดสุทธิ (Net Settlement):</span>
              <strong style={{ color: action === 'BUY' ? '#d9534f' : '#1a9871' }}>
                {money.format(netSettlement)}
              </strong>
            </div>
          </div>

          <button className="button button-primary trade-submit" disabled={!accessToken || busy} type="submit">
            {accessToken ? t('trade.submit') : t('trade.signInToTrade')}
          </button>
          <p className="form-message" role="status">{tradeMessage}</p>
        </form>
      </article>

      <div style={{ display: 'grid', gap: '16px' }}>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ใบยืนยันผลการจับคู่คำสั่ง (Execution Report)</p>
              <h2>รายงานคำสั่งล่าสุด</h2>
            </div>
          </div>
          {lastExecutionReport ? (
            <div style={{ background: '#f8faf9', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8e5' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div><span style={{ fontSize: '0.72rem', color: '#77817b' }}>Order ID</span><br /><code>{lastExecutionReport.order_id}</code></div>
                <div><span style={{ fontSize: '0.72rem', color: '#77817b' }}>หุ้น & ฝั่ง</span><br /><strong>{lastExecutionReport.symbol} ({lastExecutionReport.side})</strong></div>
                <div><span style={{ fontSize: '0.72rem', color: '#77817b' }}>สถานะ</span><br /><span className="signal-tag buy" style={{ padding: '2px 6px' }}>{lastExecutionReport.status}</span></div>
                <div><span style={{ fontSize: '0.72rem', color: '#77817b' }}>จำนวนที่จับคู่</span><br /><strong>{lastExecutionReport.filled_qty.toLocaleString()} หุ้น</strong></div>
                <div><span style={{ fontSize: '0.72rem', color: '#77817b' }}>ราคาจับคู่</span><br /><strong>{money.format(lastExecutionReport.filled_price)}</strong></div>
                <div><span style={{ fontSize: '0.72rem', color: '#77817b' }}>ค่าคอมฯ + VAT</span><br /><span>{money.format(lastExecutionReport.commission + lastExecutionReport.vat)}</span></div>
                <div><span style={{ fontSize: '0.72rem', color: '#77817b' }}>ยอดสุทธิ (Net)</span><br /><strong style={{ color: '#1a9871' }}>{money.format(lastExecutionReport.net_settlement)}</strong></div>
              </div>
            </div>
          ) : (
            <p className="table-empty">ยังไม่มีคำสั่งซื้อขายในรอบปัจจุบัน</p>
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Semi-Auto Notification</p>
              <h2>การแจ้งเตือนสัญญาณผ่าน LINE Messaging API</h2>
            </div>
            <button className="button button-outline" onClick={() => setAlertsOpen(true)} type="button">
              ตั้งค่า Token LINE
            </button>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#555', margin: '4px 0 10px 0' }}>
            เมื่อเกิดสัญญาณซื้อขายจากการสแกนสัญญาณพร้อมขนาดไม้จากระบบคำนวณความเสี่ยง ระบบจะส่งข้อความ Push Alert เข้า LINE ของคุณทันที
          </p>
          <button
            type="button"
            className="button button-quiet"
            onClick={sendTestNotification}
            disabled={notificationBusy}
          >
            {notificationBusy ? 'กำลังส่ง...' : 'ส่งสัญญาณแจ้งเตือนทดสอบเข้า LINE'}
          </button>
          {notificationMessage && <p className="form-message" role="status">{notificationMessage}</p>}
        </article>
      </div>
    </section>
  )
}

