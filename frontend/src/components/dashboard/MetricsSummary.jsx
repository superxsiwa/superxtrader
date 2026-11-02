export function MetricsSummary({
  buyCount,
  stocksCount,
  portfolio,
  portfolioMoney,
  money,
  t,
}) {
  return (
    <section className="metrics" aria-label={t('market.summary')}>
      <div className="metric">
        <span>{t('market.buySetups')}</span>
        <strong>{buyCount}</strong>
        <small>{t('market.buySetupsHint')}</small>
      </div>
      <div className="metric">
        <span>{t('market.watchlist')}</span>
        <strong>{stocksCount}</strong>
        <small>{t('market.watchlistHint')}</small>
      </div>
      <div className="metric" id="portfolio">
        <span>{t('market.portfolioValue')}</span>
        <strong>{portfolio ? portfolioMoney(portfolio.total_value) : '-'}</strong>
        <small>{portfolio ? t('market.accountValue') : t('market.signInToView')}</small>
      </div>
      <div className="metric">
        <span>{t('market.availableCash')}</span>
        <strong>{portfolio ? money.format(portfolio.cash) : '-'}</strong>
        <small>{portfolio ? t('market.paperBalance') : t('market.accountBalance')}</small>
      </div>
    </section>
  )
}

