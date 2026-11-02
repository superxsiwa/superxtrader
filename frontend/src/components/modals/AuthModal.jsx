export function AuthModal({
  authOpen,
  setAuthOpen,
  authMode,
  setAuthMode,
  authMessage,
  setAuthMessage,
  submitAuth,
  busy,
  t,
}) {
  if (!authOpen) return null

  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="auth-title" aria-modal="true" className="auth-dialog" role="dialog">
        <p className="eyebrow">{t('auth.eyebrow')}</p>
        <h2 id="auth-title">{authMode === 'login' ? t('auth.signIn') : t('auth.createAccount')}</h2>
        <form className="auth-form" onSubmit={submitAuth}>
          <label>
            {t('auth.email')}
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label>
            {t('auth.password')}
            <input
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              minLength="8"
              name="password"
              required
              type="password"
            />
          </label>
          <p className="form-message" role="status">{authMessage}</p>
          <button className="button button-primary" disabled={busy} type="submit">
            {authMode === 'login' ? t('auth.signIn') : t('auth.register')}
          </button>
        </form>
        <div className="dialog-actions">
          <button
            className="text-button"
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login')
              setAuthMessage('')
            }}
            type="button"
          >
            {authMode === 'login' ? t('auth.createAccountAction') : t('auth.backToSignIn')}
          </button>
          <button className="text-button" onClick={() => setAuthOpen(false)} type="button">
            {t('actions.close')}
          </button>
        </div>
      </section>
    </div>
  )
}

