import { Line } from 'react-chartjs-2'

export function IngestionPage({
  stocks,
  selectedSymbol,
  setSelectedSymbol,
  candles,
  chartData,
  t,
}) {
  return (
    <>
      <section className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Market Data Ingestion</p>
            <h2>สถานะการเชื่อมต่อแหล่งข้อมูลตลาด (Data Providers)</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
          <div className="risk-stat-item">
            <span style={{ color: '#1a9871', fontWeight: 'bold' }}>● Primary Provider</span>
            <strong>Yahoo Finance (Real-time & EOD)</strong>
            <small style={{ color: '#77817b' }}>สถานะ: ปกติ (Active)</small>
          </div>
          <div className="risk-stat-item">
            <span style={{ color: '#2b78e4', fontWeight: 'bold' }}>● Fallback Level 1</span>
            <strong>EODHD API</strong>
            <small style={{ color: '#77817b' }}>สถานะ: พร้อมใช้งาน (Cached 15m)</small>
          </div>
          <div className="risk-stat-item">
            <span style={{ color: '#674ea7', fontWeight: 'bold' }}>● Fallback Level 2</span>
            <strong>Twelve Data & Alpha Vantage</strong>
            <small style={{ color: '#77817b' }}>สถานะ: เชื่อมต่อ Token สำรอง</small>
          </div>
          <div className="risk-stat-item">
            <span style={{ color: '#1a9871', fontWeight: 'bold' }}>● Stream Protocol</span>
            <strong>WebSocket (/ws/market-stream)</strong>
            <small style={{ color: '#77817b' }}>Real-time Tick Streaming</small>
          </div>
        </div>
      </section>

      <section className="panel chart-panel" style={{ marginBottom: '16px' }}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">กราฟราคาประวัติแท่งเทียน (Historical OHLCV)</p>
            <h2>{selectedSymbol} - กราฟ 90 วันทำการ</h2>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {stocks.slice(0, 8).map((s) => (
              <button
                key={s.symbol}
                type="button"
                className={`button ${s.symbol === selectedSymbol ? 'button-primary' : 'button-outline'}`}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => setSelectedSymbol(s.symbol)}
              >
                {s.symbol}
              </button>
            ))}
          </div>
        </div>
        {candles.length ? (
          <div className="chart-wrap" style={{ height: '280px' }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
                scales: {
                  x: { display: true, grid: { display: false }, ticks: { maxTicksLimit: 10 } },
                  y: { border: { display: false }, grid: { color: '#e7ece8' }, ticks: { color: '#77817b' } },
                },
              }}
            />
          </div>
        ) : (
          <div className="chart-empty">{t('chart.empty')}</div>
        )}
      </section>

      <section className="panel table-panel">
        <div className="panel-heading table-heading">
          <div>
            <p className="eyebrow">ข้อมูลราคาตลาดมาตรฐาน (Normalized OHLCV Data)</p>
            <h2>รายการราคาหุ้นในระบบ</h2>
          </div>
          <span className="table-count">{stocks.length} หุ้น</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ชื่อย่อหุ้น (Symbol)</th>
                <th>ตลาด (Market)</th>
                <th>กรอบเวลา (Timeframe)</th>
                <th>ราคาล่าสุด (Close)</th>
                <th>เปลี่ยนแปลง (Change %)</th>
                <th>RSI (14)</th>
                <th>Volume Ratio</th>
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
                  <td><span className="strategy-badge">SET</span></td>
                  <td>1D</td>
                  <td><strong>{Number(stock.price).toFixed(2)}</strong></td>
                  <td style={{ color: stock.change_pct >= 0 ? '#1a9871' : '#d9534f', fontWeight: 'bold' }}>
                    {stock.change_pct >= 0 ? '+' : ''}{Number(stock.change_pct).toFixed(2)}%
                  </td>
                  <td>{Number(stock.rsi).toFixed(1)}</td>
                  <td>{Number(stock.volume_ratio).toFixed(2)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

