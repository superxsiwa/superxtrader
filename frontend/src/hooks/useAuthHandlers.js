import { useState } from 'react'
import { apiRequest } from '../api'

export function useAuthHandlers({ setAccessToken, setAuthOpen, t }) {
  const [authMode, setAuthMode] = useState('login')
  const [authMessage, setAuthMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submitAuth(event) {
    event.preventDefault()
    setBusy(true)
    setAuthMessage('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))

    try {
      if (authMode === 'register') {
        await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setAuthMode('login')
        setAuthMessage(t('auth.accountCreated'))
        return
      }

      const result = await apiRequest('/api/auth/token', {
        method: 'POST',
        body: new URLSearchParams({ username: email, password }),
      })
      setAccessToken(result.access_token)
      setAuthOpen(false)
      setAuthMessage('')
    } catch (requestError) {
      setAuthMessage(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return {
    authMode,
    setAuthMode,
    authMessage,
    setAuthMessage,
    authBusy: busy,
    submitAuth,
  }
}

