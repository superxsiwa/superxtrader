export function OpportunitiesTable({
  stocks,
  selectedSymbol,
  setSelectedSymbol,
  watchlistSymbols,
  watchlistLoadedToken,
  watchlistBusy,
  watchlistMessage,
  addSymbolToWatchlist,
  removeWatchlistSymbol,
  accessToken,
  t,
}) {
  return (
    <section className="panel table-panel" id="opportunities">
      <div className="panel-heading table-heading">
        <div>
          <p className="eyebrow">{t('opportunities.eyebrow')}</p>
          <h2>{t('opportunities.title')}</h2>
        </div>
        <span className="table-count">{t('opportunities.count', { count: stocks.length })}</span>
      </div>
      {accessToken && <p className="form-message" role="status">{watchlistMessage}</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t('table.symbol')}</th>
              <th>{t('table.price')}</th>
              <th>{t('modules.strategy')}</th>
              <th>{t('modules.stopLoss')}</th>
              <th>{t('modules.takeProfit')}</th>
              <th>{t('modules.atr')}</th>
              <th>{t('table.rsi')}</th>
              <th>{t('table.macd')}</th>
              <th>{t('table.volume')}</th>
              <th>{t('table.score')}</th>
              <th>{t('table.signal')}</th>
              {accessToken && <th>{t('watchlist.action')}</th>}
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const isWatched = watchlistSymbols.includes(stock.symbol)
              const label = t(isWatched ? 'watchlist.removeSymbol' : 'watchlist.addSymbol', {
                symbol: stock.symbol,
              })
              return (
                <tr
                  className={stock.symbol === selectedSymbol ? 'selected-row' : ''}
                  key={stock.symbol}
                  onClick={() => setSelectedSymbol(stock.symbol)}
                >
                  <td><strong>{stock.symbol}</strong></td>
                  <td>{Number(stock.price).toFixed(2)}</td>
                  <td><span className="strategy-badge">{stock.strategy_name || 'Breakout'}</span></td>
                  <td style={{ color: '#d9534f', fontWeight: 'bold' }}>
                    {stock.suggested_stop_loss ? Number(stock.suggested_stop_loss).toFixed(2) : '-'}
                  </td>
                  <td style={{ color: '#1a9871', fontWeight: 'bold' }}>
                    {stock.suggested_take_profit ? Number(stock.suggested_take_profit).toFixed(2) : '-'}
                  </td>
                  <td>{stock.atr14 ? Number(stock.atr14).toFixed(2) : '-'}</td>
                  <td>{Number(stock.rsi).toFixed(1)}</td>
                  <td>{Number(stock.macd).toFixed(2)}</td>
                  <td>{Number(stock.volume_ratio).toFixed(2)}x</td>
                  <td>{stock.score}</td>
                  <td>
                    <span className={`signal-tag ${stock.recommendation.toLowerCase()}`}>
                      {t(`signals.${stock.recommendation}`, { defaultValue: stock.recommendation })}
                    </span>
                  </td>
                  {accessToken && (
                    <td>
                      <button
                        aria-label={label}
                        className="watchlist-row-action"
                        disabled={watchlistLoadedToken !== accessToken || watchlistBusy}
                        onClick={(event) => {
                          event.stopPropagation()
                          if (isWatched) removeWatchlistSymbol(stock.symbol)
                          else addSymbolToWatchlist(stock.symbol)
                        }}
                        title={label}
                        type="button"
                      >
                        {isWatched ? t('watchlist.remove') : t('watchlist.add')}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!stocks.length && <p className="table-empty">{t('opportunities.empty')}</p>}
    </section>
  )
}

