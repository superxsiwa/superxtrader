export function AlertsModal({
  alertsOpen,
  setAlertsOpen,
  saveNotificationSettings,
  lineUserId,
  setLineUserId,
  lineConfigured,
  lineChannelAccessToken,
  setLineChannelAccessToken,
  disconnectNotifications,
  sendTestNotification,
  notificationBusy,
  notificationMessage,
  t,
}) {
  if (!alertsOpen) return null

  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="alerts-title" aria-modal="true" className="auth-dialog feature-dialog" role="dialog">
        <p className="eyebrow">{t('notifications.eyebrow')}</p>
        <h2 id="alerts-title">{t('notifications.title')}</h2>
        <form className="feature-form alert-form" onSubmit={saveNotificationSettings}>
          <label htmlFor="line-user-id">
            {t('notifications.lineUserId')}
            <input
              autoComplete="off"
              id="line-user-id"
              pattern="U[0-9a-fA-F]{32}"
              required
              value={lineUserId}
              onChange={(event) => setLineUserId(event.target.value)}
            />
          </label>
          <label htmlFor="line-access-token">
            {t('notifications.channelAccessToken')}
            <input
              autoComplete="new-password"
              id="line-access-token"
              placeholder={lineConfigured ? t('notifications.tokenSaved') : ''}
              required={!lineConfigured}
              type="password"
              value={lineChannelAccessToken}
              onChange={(event) => setLineChannelAccessToken(event.target.value)}
            />
          </label>
          <div className="settings-actions">
            {lineConfigured && (
              <button
                className="text-button"
                disabled={notificationBusy}
                onClick={disconnectNotifications}
                type="button"
              >
                {t('notifications.disconnect')}
              </button>
            )}
            <button
              className="button button-quiet"
              disabled={notificationBusy || !lineConfigured}
              onClick={sendTestNotification}
              type="button"
            >
              {notificationBusy ? t('notifications.testing') : t('notifications.test')}
            </button>
            <button className="button button-primary" disabled={notificationBusy} type="submit">
              {notificationBusy ? t('notifications.saving') : t('notifications.save')}
            </button>
          </div>
        </form>
        <p className="form-message" role="status">{notificationMessage}</p>
        <div className="settings-actions">
          <button className="button button-quiet" onClick={() => setAlertsOpen(false)} type="button">
            {t('actions.close')}
          </button>
        </div>
      </section>
    </div>
  )
}

