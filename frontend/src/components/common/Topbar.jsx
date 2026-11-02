export function Topbar({
  activePage,
  accessToken,
  busy,
  logout,
  openAuth,
  refreshScan,
  i18n,
  t,
}) {
  const canRefresh = ['dashboard', 'watchlist', 'module1_ingestion', 'module2_signals'].includes(activePage)

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{t('header.eyebrow')}</p>
        <h1>{t(`navigation.${activePage}`)}</h1>
      </div>
      <div className="topbar-actions">
        <span className="market-date">{t('header.marketClose')}</span>
        <div aria-label={t('language.label')} className="language-switch" role="group">
          <button
            aria-pressed={i18n.language === 'th'}
            className={i18n.language === 'th' ? 'language-button active' : 'language-button'}
            onClick={() => i18n.changeLanguage('th')}
            type="button"
          >
            {t('language.thai')}
          </button>
          <button
            aria-pressed={i18n.language === 'en'}
            className={i18n.language === 'en' ? 'language-button active' : 'language-button'}
            onClick={() => i18n.changeLanguage('en')}
            type="button"
          >
            {t('language.english')}
          </button>
        </div>
        {accessToken ? (
          <button className="button button-quiet" onClick={logout} type="button">
            {t('actions.signOut')}
          </button>
        ) : (
          <button className="button button-quiet" onClick={openAuth} type="button">
            {t('actions.signIn')}
          </button>
        )}
        {canRefresh && (
          <button
            className="button button-primary"
            disabled={busy}
            onClick={refreshScan}
            type="button"
          >
            {busy ? t('actions.refreshing') : t('actions.refresh')}
          </button>
        )}
      </div>
    </header>
  )
}

