export function ConfigModal({
  configOpen,
  setConfigOpen,
  maxStocks,
  setMaxStocks,
  submitConfig,
  configMessage,
  configBusy,
  t,
}) {
  if (!configOpen) return null

  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="config-title" aria-modal="true" className="auth-dialog config-dialog" role="dialog">
        <p className="eyebrow">{t('settings.eyebrow')}</p>
        <h2 id="config-title">{t('settings.title')}</h2>
        <form className="trade-form config-form" onSubmit={submitConfig}>
          <label htmlFor="max-stocks">
            {t('settings.maximumStocks')}
            <input
              id="max-stocks"
              min="1"
              onChange={(event) => setMaxStocks(event.target.value)}
              required
              step="1"
              type="number"
              value={maxStocks}
            />
          </label>
          <p className="form-message" role="status">{configMessage}</p>
          <div className="settings-actions">
            <button className="button button-quiet" onClick={() => setConfigOpen(false)} type="button">
              {t('actions.close')}
            </button>
            <button
              className="button button-primary"
              disabled={configBusy || !maxStocks}
              type="submit"
            >
              {configBusy ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

