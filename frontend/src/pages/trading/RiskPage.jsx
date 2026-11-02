export function RiskPage({
  stocks,
  tradeSymbol,
  setTradeSymbol,
  selectedStock,
  setSelectedSymbol,
  riskPct,
  setRiskPct,
  customStopLoss,
  setCustomStopLoss,
  customTakeProfit,
  setCustomTakeProfit,
  calculateSizing,
  sizingBusy,
  sizingResult,
  applySizing,
  navigateToPage,
  money,
}) {
  return (
    <section className="work-grid" style={{ gridTemplateColumns: 'minmax(320px, 420px) 1fr' }}>
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Risk & Position Sizing</p>
            <h2>พารามิเตอร์จำกัดความเสี่ยง</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          <label>
            ชื่อย่อหุ้น (Symbol)
            <select
              value={tradeSymbol}
              onChange={(e) => {
                const sym = e.target.value
                setTradeSymbol(sym)
                setSelectedSymbol(sym)
                const st = stocks.find((s) => s.symbol === sym)
                if (st) {
                  setCustomStopLoss(st.suggested_stop_loss ? String(st.suggested_stop_loss) : '')
                  setCustomTakeProfit(st.suggested_take_profit ? String(st.suggested_take_profit) : '')
                }
              }}
            >
              {stocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} ({s.recommendation})
                </option>
              ))}
            </select>
          </label>

          <div className="form-split">
            <label>
              ราคาเข้าซื้อ (Entry Price)
              <input
                type="number"
                step="0.05"
                value={selectedStock?.price || ''}
                readOnly
                style={{ background: '#f5f5f5' }}
              />
            </label>
            <label>
              ความเสี่ยงต่อไม้ (% Risk)
              <select
                value={riskPct}
                onChange={(e) => {
                  const r = Number(e.target.value)
                  setRiskPct(r)
                  calculateSizing(r)
                }}
              >
                <option value={0.01}>1% Risk (แนะนำ)</option>
                <option value={0.02}>2% Risk</option>
                <option value={0.03}>3% Risk</option>
              </select>
            </label>
          </div>

          <div className="form-split">
            <label>
              จุดตัดขาดทุน (Stop Loss)
              <input
                type="number"
                step="0.05"
                value={customStopLoss}
                onChange={(e) => setCustomStopLoss(e.target.value)}
              />
            </label>
            <label>
              เป้าหมายทำกำไร (Take Profit)
              <input
                type="number"
                step="0.05"
                value={customTakeProfit}
                onChange={(e) => setCustomTakeProfit(e.target.value)}
              />
            </label>
          </div>

          <button
            type="button"
            className="button button-primary"
            style={{ width: '100%', marginTop: '6px' }}
            disabled={sizingBusy}
            onClick={() => calculateSizing()}
          >
            {sizingBusy ? 'กำลังคำนวณ...' : 'คำนวณขนาดไม้ (Calculate)'}
          </button>
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">สูตร Fixed Fractional Position Sizing</p>
            <h2>แผนการเทรดที่ผ่านการควบคุมความเสี่ยง</h2>
          </div>
        </div>
        {sizingResult ? (
          <div>
            <div className="risk-sizing-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div className="risk-stat-item">
                <span>มูลค่าพอร์ตรวม (Total Equity)</span>
                <strong>{money.format(sizingResult.portfolio_equity)}</strong>
              </div>
              <div className="risk-stat-item">
                <span>เงินสดคงเหลือ (Available Cash)</span>
                <strong>{money.format(sizingResult.available_cash)}</strong>
              </div>
              <div className="risk-stat-item">
                <span>เงินที่ยอมเสียได้สูงสุด ({sizingResult.risk_pct_per_trade * 100}% Risk)</span>
                <strong style={{ color: '#d9534f' }}>{money.format(sizingResult.max_risk_baht)}</strong>
              </div>
              <div className="risk-stat-item">
                <span>ความเสี่ยงต่อหุ้น (Entry - Stop Loss)</span>
                <strong>{sizingResult.risk_per_share.toFixed(2)} THB</strong>
              </div>
              <div className="risk-stat-item" style={{ border: '2px solid #1a9871' }}>
                <span style={{ color: '#1a9871', fontWeight: 'bold' }}>จำนวนหุ้นที่ควรซื้อ (Board Lot 100)</span>
                <strong style={{ fontSize: '1.2rem', color: '#1a9871' }}>
                  {sizingResult.recommended_qty.toLocaleString()} หุ้น
                </strong>
              </div>
              <div className="risk-stat-item">
                <span>มูลค่าเงินที่ใช้ (Gross Cost)</span>
                <strong>{money.format(sizingResult.estimated_gross_cost)}</strong>
              </div>
              <div className="risk-stat-item">
                <span>อัตราผลตอบแทนต่อความเสี่ยง (Risk/Reward)</span>
                <strong style={{ color: '#1a9871' }}>{sizingResult.risk_reward_ratio}x</strong>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#166534', display: 'block' }}>พร้อมส่งคำสั่งเทรดตามแผนนี้หรือไม่?</strong>
                <small style={{ color: '#15803d' }}>
                  ซื้อ {sizingResult.symbol} จำนวน {sizingResult.recommended_qty.toLocaleString()} หุ้น ที่ราคา {sizingResult.entry_price.toFixed(2)} THB
                </small>
              </div>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  applySizing()
                  navigateToPage('module4_execution')
                }}
              >
                นำแผนนี้ไปส่งคำสั่งซื้อขาย &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="chart-empty" style={{ height: '220px' }}>
            กดปุ่ม "คำนวณขนาดไม้" เพื่อประมวลผลขนาดไม้ที่ปลอดภัย
          </div>
        )}
      </article>
    </section>
  )
}

