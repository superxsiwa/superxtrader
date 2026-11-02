import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

export function useWatchlist({ accessToken, t }) {
  const [watchlistOpen, setWatchlistOpen] = useState(false)
  const [watchlistSymbols, setWatchlistSymbols] = useState([])
  const [watchlistInput, setWatchlistInput] = useState('')
  const [watchlistMessage, setWatchlistMessage] = useState('')
  const [watchlistBusy, setWatchlistBusy] = useState(false)
  const [watchlistLoadedToken, setWatchlistLoadedToken] = useState('')

  useEffect(() => {
    if (!accessToken) return undefined

    let active = true
    apiRequest('/api/watchlist')
      .then((result) => {
        if (active) {
          setWatchlistSymbols(result)
          setWatchlistMessage('')
          setWatchlistLoadedToken(accessToken)
        }
      })
      .catch((requestError) => {
        if (active) setWatchlistMessage(requestError.message)
      })
    return () => { active = false }
  }, [accessToken])

  async function addSymbolToWatchlist(symbol) {
    setWatchlistBusy(true)
    setWatchlistMessage('')
    try {
      const result = await apiRequest('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ symbol: symbol.trim().toUpperCase() }),
      })
      setWatchlistSymbols((current) => [...new Set([...current, result.symbol])].sort())
      setWatchlistMessage(t('watchlist.added'))
      return true
    } catch (requestError) {
      setWatchlistMessage(requestError.message)
      return false
    } finally {
      setWatchlistBusy(false)
    }
  }

  async function addWatchlistSymbol(event) {
    event.preventDefault()
    if (await addSymbolToWatchlist(watchlistInput)) setWatchlistInput('')
  }

  async function removeWatchlistSymbol(symbol) {
    setWatchlistBusy(true)
    setWatchlistMessage('')
    try {
      await apiRequest(`/api/watchlist/${encodeURIComponent(symbol)}`, { method: 'DELETE' })
      setWatchlistSymbols((current) => current.filter((item) => item !== symbol))
      setWatchlistMessage(t('watchlist.removed'))
    } catch (requestError) {
      setWatchlistMessage(requestError.message)
    } finally {
      setWatchlistBusy(false)
    }
  }

  return {
    watchlistOpen,
    setWatchlistOpen,
    watchlistSymbols,
    setWatchlistSymbols,
    watchlistInput,
    setWatchlistInput,
    watchlistMessage,
    setWatchlistMessage,
    watchlistBusy,
    watchlistLoadedToken,
    addSymbolToWatchlist,
    addWatchlistSymbol,
    removeWatchlistSymbol,
  }
}

