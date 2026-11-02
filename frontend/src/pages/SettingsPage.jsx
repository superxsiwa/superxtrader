export function SettingsPage({
  accessToken,
  isAdmin,
  setWatchlistOpen,
  setAlertsOpen,
  setConfigOpen,
  setManageStocksOpen,
  setAuthOpen,
  t,
}) {
  return (
    <section aria-label={t('navigation.settings')} className="settings-grid">
      {accessToken ? (
        <>
          <article className="panel settings-card">
            <div>
              <p className="eyebrow">{t('watchlist.eyebrow')}</p>
              <h2>{t('watchlist.title')}</h2>
              <p>{t('settingsPage.watchlistDescription')}</p>
            </div>
            <button className="button button-primary" onClick={() => setWatchlistOpen(true)} type="button">
              {t('actions.myWatchlist')}
            </button>
          </article>
          <article className="panel settings-card">
            <div>
              <p className="eyebrow">{t('notifications.eyebrow')}</p>
              <h2>{t('notifications.title')}</h2>
              <p>{t('settingsPage.notificationsDescription')}</p>
            </div>
            <button className="button button-primary" onClick={() => setAlertsOpen(true)} type="button">
              {t('actions.alertSettings')}
            </button>
          </article>
          {isAdmin && (
            <>
              <article className="panel settings-card">
                <div>
                  <p className="eyebrow">{t('settings.eyebrow')}</p>
                  <h2>{t('settings.title')}</h2>
                  <p>{t('settingsPage.configurationDescription')}</p>
                </div>
                <button
                  className="button button-primary"
                  onClick={() => {
                    setManageStocksOpen(false)
                    setConfigOpen(true)
                  }}
                  type="button"
                >
                  {t('actions.settings')}
                </button>
              </article>
              <article className="panel settings-card">
                <div>
                  <p className="eyebrow">{t('settings.eyebrow')}</p>
                  <h2>{t('actions.manageStocks', { defaultValue: 'Manage Stocks' })}</h2>
                  <p>{t('settingsPage.stocksDescription')}</p>
                </div>
                <button
                  className="button button-primary"
                  onClick={() => {
                    setConfigOpen(false)
                    setManageStocksOpen(true)
                  }}
                  type="button"
                >
                  {t('actions.manageStocks', { defaultValue: 'Manage Stocks' })}
                </button>
              </article>
            </>
          )}
        </>
      ) : (
        <article className="panel access-panel">
          <h2>{t('navigation.settings')}</h2>
          <p>{t('settingsPage.signInDescription')}</p>
          <button className="button button-primary" onClick={() => setAuthOpen(true)} type="button">
            {t('actions.signIn')}
          </button>
        </article>
      )}
    </section>
  )
}

