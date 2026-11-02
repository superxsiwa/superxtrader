import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

export function useSettingsData({ manageStocksOpen, configOpen, alertsOpen, t }) {
  const [rawStocks, setRawStocks] = useState([])
  const [newStockSymbol, setNewStockSymbol] = useState('')
  const [stockMessage, setStockMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const [configOpenState, setConfigOpen] = useState(false)
  const [maxStocks, setMaxStocks] = useState('')
  const [configMessage, setConfigMessage] = useState('')
  const [configBusy, setConfigBusy] = useState(false)

  const [alertsOpenState, setAlertsOpen] = useState(false)
  const [lineUserId, setLineUserId] = useState('')
  const [lineChannelAccessToken, setLineChannelAccessToken] = useState('')
  const [lineConfigured, setLineConfigured] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationBusy, setNotificationBusy] = useState(false)

  async function fetchRawStocks() {
    try {
      const res = await apiRequest('/api/stocks')
      setRawStocks(res)
    } catch (e) {
      setStockMessage(e.message)
    }
  }

  useEffect(() => {
    if (!manageStocksOpen) return undefined
    let active = true
    apiRequest('/api/stocks')
      .then((result) => {
        if (active) setRawStocks(result)
      })
      .catch((requestError) => {
        if (active) setStockMessage(requestError.message)
      })
    return () => { active = false }
  }, [manageStocksOpen])

  useEffect(() => {
    if (!configOpen && !configOpenState) return undefined
    let active = true
    apiRequest('/api/config')
      .then((result) => {
        if (active) {
          setMaxStocks(String(result.MAX_STOCKS ?? ''))
          setConfigMessage('')
        }
      })
      .catch((requestError) => {
        if (active) setConfigMessage(requestError.message)
      })
    return () => { active = false }
  }, [configOpen, configOpenState])

  useEffect(() => {
    if (!alertsOpen && !alertsOpenState) return undefined
    let active = true
    apiRequest('/api/notifications/settings')
      .then((result) => {
        if (active) {
          setLineUserId(result.line_user_id || '')
          setLineConfigured(result.configured)
          setLineChannelAccessToken('')
          setNotificationMessage('')
        }
      })
      .catch((requestError) => {
        if (active) setNotificationMessage(requestError.message)
      })
    return () => { active = false }
  }, [alertsOpen, alertsOpenState])

  async function submitAddStock(e) {
    e.preventDefault()
    setBusy(true)
    setStockMessage('')
    try {
      await apiRequest('/api/stocks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: newStockSymbol }),
      })
      setNewStockSymbol('')
      await fetchRawStocks()
    } catch (err) {
      setStockMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteStock(id) {
    if (!window.confirm('Are you sure?')) return
    setBusy(true)
    setStockMessage('')
    try {
      await apiRequest(`/api/stocks/${id}`, { method: 'DELETE' })
      await fetchRawStocks()
    } catch (err) {
      setStockMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitConfig(e) {
    e.preventDefault()
    setConfigBusy(true)
    setConfigMessage('')
    try {
      await apiRequest('/api/config', {
        method: 'PUT',
        body: JSON.stringify({ key: 'MAX_STOCKS', value: Number(maxStocks) }),
      })
      setConfigMessage(t('settings.saved'))
    } catch (requestError) {
      setConfigMessage(requestError.message)
    } finally {
      setConfigBusy(false)
    }
  }

  async function saveNotificationSettings(event) {
    event.preventDefault()
    setNotificationBusy(true)
    setNotificationMessage('')
    try {
      const body = { line_user_id: lineUserId.trim() }
      if (lineChannelAccessToken.trim()) body.channel_access_token = lineChannelAccessToken.trim()
      const result = await apiRequest('/api/notifications/settings', {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      setLineUserId(result.line_user_id)
      setLineConfigured(result.configured)
      setLineChannelAccessToken('')
      setNotificationMessage(t('notifications.saved'))
    } catch (requestError) {
      setNotificationMessage(requestError.message)
    } finally {
      setNotificationBusy(false)
    }
  }

  async function sendTestNotification() {
    setNotificationBusy(true)
    setNotificationMessage('')
    try {
      await apiRequest('/api/notifications/test', { method: 'POST' })
      setNotificationMessage(t('notifications.testSent'))
    } catch (requestError) {
      setNotificationMessage(requestError.message)
    } finally {
      setNotificationBusy(false)
    }
  }

  async function disconnectNotifications() {
    setNotificationBusy(true)
    setNotificationMessage('')
    try {
      await apiRequest('/api/notifications/settings', { method: 'DELETE' })
      setLineUserId('')
      setLineConfigured(false)
      setLineChannelAccessToken('')
      setNotificationMessage(t('notifications.disconnected'))
    } catch (requestError) {
      setNotificationMessage(requestError.message)
    } finally {
      setNotificationBusy(false)
    }
  }

  return {
    rawStocks,
    newStockSymbol,
    setNewStockSymbol,
    stockMessage,
    busy,
    configOpen: configOpenState,
    setConfigOpen,
    maxStocks,
    setMaxStocks,
    configMessage,
    configBusy,
    alertsOpen: alertsOpenState,
    setAlertsOpen,
    lineUserId,
    setLineUserId,
    lineChannelAccessToken,
    setLineChannelAccessToken,
    lineConfigured,
    notificationMessage,
    notificationBusy,
    fetchRawStocks,
    submitAddStock,
    deleteStock,
    submitConfig,
    saveNotificationSettings,
    sendTestNotification,
    disconnectNotifications,
  }
}

