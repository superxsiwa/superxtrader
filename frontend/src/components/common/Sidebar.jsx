export function Sidebar({
  activePage,
  navigateToPage,
  watchlistCount = 0,
  accessToken,
  t,
}) {
  return (
    <aside className="sidebar">
      <a
        aria-label={t('document.title')}
        className="brand"
        href="#overview"
        onClick={(event) => {
          event.preventDefault()
          navigateToPage('dashboard')
        }}
      >
        <span className="brand-mark">SX</span>
        <span>
          <strong>SuperX</strong>
          <small>{t('brand.tagline')}</small>
        </span>
      </a>

      <nav className="nav-list" aria-label={t('navigation.label')}>
        {/* หมวดหมู่: การเทรด */}
        <div className="nav-section-title">{t('navigation.section_modules')}</div>
        {[
          { id: 'module1_ingestion' },
          { id: 'module2_signals' },
          { id: 'module3_risk' },
          { id: 'module4_execution' },
          { id: 'module5_ledger' },
        ].map((item) => (
          <button
            aria-current={activePage === item.id ? 'page' : undefined}
            className={`nav-item nav-action${activePage === item.id ? ' active' : ''}`}
            key={item.id}
            onClick={() => navigateToPage(item.id)}
            type="button"
          >
            <span>{t(`navigation.${item.id}`)}</span>
          </button>
        ))}

        {/* หมวดหมู่: หน้าจอที่จำเป็น */}
        <div className="nav-section-title">{t('navigation.section_essential')}</div>
        <button
          aria-current={activePage === 'dashboard' ? 'page' : undefined}
          className={`nav-item nav-action${activePage === 'dashboard' ? ' active' : ''}`}
          onClick={() => navigateToPage('dashboard')}
          type="button"
        >
          <span>{t('navigation.dashboard')}</span>
        </button>
        <button
          aria-current={activePage === 'watchlist' ? 'page' : undefined}
          className={`nav-item nav-action${activePage === 'watchlist' ? ' active' : ''}`}
          onClick={() => navigateToPage('watchlist')}
          type="button"
        >
          <span>{t('navigation.watchlist')}</span>
          {watchlistCount > 0 && <span className="nav-badge">{watchlistCount}</span>}
        </button>

        {/* หมวดหมู่: ตั้งค่า */}
        <div className="nav-section-title">{t('navigation.section_system')}</div>
        <button
          aria-current={activePage === 'settings' ? 'page' : undefined}
          className={`nav-item nav-action${activePage === 'settings' ? ' active' : ''}`}
          onClick={() => navigateToPage('settings')}
          type="button"
        >
          <span>{t('navigation.settings')}</span>
        </button>
      </nav>

      <div className="sidebar-status">
        <span className="status-dot" />
        <span>{t('market.watchlistHint')}</span>
        <strong>{t('market.daily')}</strong>
      </div>
      <div className="sidebar-bottom">
        <span className="eyebrow">{t('session.label')}</span>
        <strong>{accessToken ? t('session.authenticated') : t('session.guest')}</strong>
      </div>
    </aside>
  )
}

