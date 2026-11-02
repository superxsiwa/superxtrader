export function WatchlistModal({
  watchlistOpen,
  setWatchlistOpen,
  watchlistInput,
  setWatchlistInput,
  addWatchlistSymbol,
  watchlistBusy,
  watchlistMessage,
  watchlistSymbols,
  stocks,
  removeWatchlistSymbol,
  t,
}) {
  if (!watchlistOpen) return null

  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="watchlist-title" aria-modal="true" className="auth-dialog feature-dialog" role="dialog">
        <p className="eyebrow">{t('watchlist.eyebrow')}</p>
        <h2 id="watchlist-title">{t('watchlist.title')}</h2>
        <form className="feature-form watchlist-form" onSubmit={addWatchlistSymbol}>
          <label htmlFor="watchlist-symbol">
            {t('watchlist.symbol')}
            <input
              autoCapitalize="characters"
              id="watchlist-symbol"
              maxLength="20"
              onChange={(event) => setWatchlistInput(event.target.value)}
              required
              value={watchlistInput}
            />
          </label>
          <button className="button button-primary" disabled={watchlistBusy} type="submit">
            {t('watchlist.add')}
          </button>
        </form>
        <p className="form-message" role="status">{watchlistMessage}</p>
        <div className="table-scroll feature-table">
          <table>
            <thead>
              <tr>
                <th>{t('table.symbol')}</th>
                <th>{t('table.price')}</th>
                <th>{t('table.signal')}</th>
                <th>{t('watchlist.action')}</th>
              </tr>
            </thead>
            <tbody>
              {watchlistSymbols.map((symbol) => {
                const stock = stocks.find((item) => item.symbol === symbol)
                return (
                  <tr key={symbol}>
                    <td><strong>{symbol}</strong></td>
                    <td>{stock ? Number(stock.price).toFixed(2) : '-'}</td>
                    <td>{stock ? t(`signals.${stock.recommendation}`, { defaultValue: stock.recommendation }) : '-'}</td>
                    <td>
                      <button
                        className="text-button"
                        disabled={watchlistBusy}
                        onClick={() => removeWatchlistSymbol(symbol)}
                        type="button"
                      >
                        {t('watchlist.remove')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!watchlistSymbols.length && <p className="table-empty">{t('watchlist.empty')}</p>}
        <div className="settings-actions">
          <button className="button button-quiet" onClick={() => setWatchlistOpen(false)} type="button">
            {t('actions.close')}
          </button>
        </div>
      </section>
    </div>
  )
}

