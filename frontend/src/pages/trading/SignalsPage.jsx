export function SignalsPage({
  stocks,
  selectedSymbol,
  setSelectedSymbol,
  setTradeSymbol,
  setCustomStopLoss,
  setCustomTakeProfit,
  navigateToPage,
}) {
  return (
    <>
      <section className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Signal & Analysis Engine</p>
            <h2>กฎการคัดกรองสัญญาณทางเทคนิค (Rule-Based Screener)</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '10px' }}>
          <div className="risk-stat-item">
            <span className="strategy-badge" style={{ marginBottom: '4px' }}>Breakout_Volume_Spike</span>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#555' }}>
              ราคาปิดทะลุ High 20 วัน + Volume &ge; 1.4x + RSI อยู่ระหว่าง 52–75
            </p>
          </div>
          <div className="risk-stat-item">
            <span className="strategy-badge" style={{ marginBottom: '4px' }}>Trend_Continuation</span>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#555' }}>
              ราคายืนเหนือ EMA 20 &gt; EMA 50 &gt; EMA 200 + RSI &gt; 50 + MACD ขาขึ้น
            </p>
          </div>
          <div className="risk-stat-item">
            <span className="strategy-badge" style={{ marginBottom: '4px' }}>Oversold_Rebound</span>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#555' }}>
              RSI &lt; 38 หรือ Stochastic %K &lt; 25 เกิดจุดกลับตัวเด้งขึ้น
            </p>
          </div>
          <div className="risk-stat-item">
            <span className="strategy-badge" style={{ marginBottom: '4px', background: '#fee', color: '#c00' }}>Exit_Rule</span>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#555' }}>
              ราคาหลุดเส้น EMA 20 หรือแตะระดับตัดขาดทุน Stop Loss
            </p>
          </div>
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading table-heading">
          <div>
            <p className="eyebrow">ผลการสแกนและสัญญาณเทรดล่าสุด</p>
            <h2>รายการหุ้นที่เข้าเงื่อนไขสัญญาณ</h2>
          </div>
          <span className="table-count">{stocks.length} หุ้น</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ชื่อย่อหุ้น</th>
                <th>สัญญาณ</th>
                <th>กลยุทธ์</th>
                <th>ราคาเข้า (Entry)</th>
                <th>จุดคัท (Stop Loss)</th>
                <th>เป้าหมาย (Take Profit)</th>
                <th>ATR (14)</th>
                <th>EMA 20</th>
                <th>EMA 50</th>
                <th>MACD</th>
                <th>RSI (14)</th>
                <th>Volume</th>
                <th>คะแนน</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr
                  key={stock.symbol}
                  className={stock.symbol === selectedSymbol ? 'selected-row' : ''}
                  onClick={() => setSelectedSymbol(stock.symbol)}
                >
                  <td><strong>{stock.symbol}</strong></td>
                  <td>
                    <span className={`signal-tag ${stock.recommendation.toLowerCase()}`}>
                      {stock.recommendation}
                    </span>
                  </td>
                  <td><span className="strategy-badge">{stock.strategy_name || 'Breakout'}</span></td>
                  <td><strong>{Number(stock.price).toFixed(2)}</strong></td>
                  <td style={{ color: '#d9534f', fontWeight: 'bold' }}>
                    {stock.suggested_stop_loss ? Number(stock.suggested_stop_loss).toFixed(2) : '-'}
                  </td>
                  <td style={{ color: '#1a9871', fontWeight: 'bold' }}>
                    {stock.suggested_take_profit ? Number(stock.suggested_take_profit).toFixed(2) : '-'}
                  </td>
                  <td>{stock.atr14 ? Number(stock.atr14).toFixed(2) : '-'}</td>
                  <td>{Number(stock.ema20 || stock.price).toFixed(2)}</td>
                  <td>{Number(stock.ema50).toFixed(2)}</td>
                  <td>{Number(stock.macd).toFixed(2)}</td>
                  <td>{Number(stock.rsi).toFixed(1)}</td>
                  <td>{Number(stock.volume_ratio).toFixed(2)}x</td>
                  <td>{stock.score}</td>
                  <td>
                    <button
                      type="button"
                      className="button button-outline"
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSymbol(stock.symbol)
                        setTradeSymbol(stock.symbol)
                        setCustomStopLoss(stock.suggested_stop_loss ? String(stock.suggested_stop_loss) : '')
                        setCustomTakeProfit(stock.suggested_take_profit ? String(stock.suggested_take_profit) : '')
                        navigateToPage('module3_risk')
                      }}
                    >
                      คำนวณขนาดไม้ &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

