export function QuickTradePanel({
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
  customStopLoss,
  setCustomStopLoss,
  riskPct,
  setRiskPct,
  calculateSizing,
  sizingBusy,
  sizingResult,
  applySizing,
  money,
  t,
}) {
  return (
    <article className="panel trade-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t('trade.eyebrow')}</p>
          <h2>{t('trade.title')}</h2>
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
        <button
          className="button button-primary trade-submit"
          disabled={!accessToken || busy}
          type="submit"
        >
          {accessToken ? t('trade.submit') : t('trade.signInToTrade')}
        </button>
        <p className="form-message" role="status">{tradeMessage}</p>
      </form>

      {/* Risk & Position Sizing Card */}
      <div className="risk-sizing-card">
        <h4>
          <span>{t('risk.title')}</span>
          <span className="strategy-badge">{selectedStock?.strategy_name || 'Standard'}</span>
        </h4>
        <div className="form-split" style={{ marginBottom: '8px' }}>
          <label>
            {t('risk.stopLoss')}
            <input
              type="number"
              step="0.05"
              value={customStopLoss}
              onChange={(e) => setCustomStopLoss(e.target.value)}
              placeholder={selectedStock?.suggested_stop_loss ? String(selectedStock.suggested_stop_loss) : ''}
            />
          </label>
          <label>
            {t('risk.riskPct')}
            <select
              value={riskPct}
              onChange={(e) => {
                const v = Number(e.target.value)
                setRiskPct(v)
                calculateSizing(v)
              }}
            >
              <option value={0.01}>1% Risk</option>
              <option value={0.02}>2% Risk</option>
              <option value={0.03}>3% Risk</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button
            type="button"
            className="button button-outline"
            style={{ flex: 1 }}
            disabled={sizingBusy}
            onClick={() => calculateSizing()}
          >
            {sizingBusy ? t('risk.calculating') : t('risk.calculate')}
          </button>
        </div>
        {sizingResult && (
          <div>
            <div className="risk-sizing-grid">
              <div className="risk-stat-item">
                <span>{t('risk.recommendedQty')}</span>
                <strong>{sizingResult.recommended_qty.toLocaleString()} หุ้น</strong>
              </div>
              <div className="risk-stat-item">
                <span>{t('risk.maxRisk')}</span>
                <strong>{money.format(sizingResult.max_risk_baht)}</strong>
              </div>
              <div className="risk-stat-item">
                <span>{t('risk.estimatedCost')}</span>
                <strong>{money.format(sizingResult.estimated_gross_cost)}</strong>
              </div>
              <div className="risk-stat-item">
                <span>{t('risk.riskReward')}</span>
                <strong>{sizingResult.risk_reward_ratio}x</strong>
              </div>
            </div>
            <button
              type="button"
              className="button button-primary"
              style={{ width: '100%', padding: '7px' }}
              onClick={applySizing}
            >
              {t('risk.apply')} ({sizingResult.recommended_qty.toLocaleString()} หุ้น)
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

