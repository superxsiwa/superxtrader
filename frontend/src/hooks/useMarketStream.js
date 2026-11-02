import { useEffect } from 'react'

export function useMarketStream({ accessToken, updatePortfolioPrices, setError, t }) {
  useEffect(() => {
    if (!accessToken) return undefined

    let active = true
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/market-stream`)

    socket.addEventListener('open', () => {
      if (active && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'auth', token: accessToken }))
      }
    })

    socket.addEventListener('message', (event) => {
      if (!active) return

      let message
      try {
        message = JSON.parse(event.data)
      } catch {
        setError(t('errors.marketStreamInvalidResponse'))
        return
      }
      if (!message || typeof message !== 'object' || Array.isArray(message)) {
        setError(t('errors.marketStreamInvalidResponse'))
        return
      }

      if (message.type === 'price_update' && Array.isArray(message.prices)) {
        updatePortfolioPrices(message.prices)
      } else if (message.type === 'error' && message.code === 'market_data_unavailable') {
        setError(t('errors.marketDataUnavailable'))
      }
    })

    socket.addEventListener('error', () => {
      if (active) setError(t('errors.marketStreamUnavailable'))
    })

    return () => {
      active = false
      socket.close()
    }
  }, [accessToken, setError, t, updatePortfolioPrices])
}

