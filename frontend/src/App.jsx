import { useEffect, useState } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { useTranslation } from 'react-i18next'
import { apiRequest } from './api'
import { useAppStore } from './store'
import { createFormatters } from './utils/formatters'

// Layout & Common
import { Sidebar } from './components/common/Sidebar'
import { Topbar } from './components/common/Topbar'

// Pages
import { DashboardPage } from './pages/DashboardPage'
import { IngestionPage } from './pages/trading/IngestionPage'
import { SignalsPage } from './pages/trading/SignalsPage'
import { RiskPage } from './pages/trading/RiskPage'
import { ExecutionPage } from './pages/trading/ExecutionPage'
import { LedgerPage } from './pages/trading/LedgerPage'
import { WatchlistPage } from './pages/WatchlistPage'
import { SettingsPage } from './pages/SettingsPage'

// Modals
import { AuthModal } from './components/modals/AuthModal'
import { ManageStocksModal } from './components/modals/ManageStocksModal'
import { ConfigModal } from './components/modals/ConfigModal'
import { WatchlistModal } from './components/modals/WatchlistModal'
import { AlertsModal } from './components/modals/AlertsModal'

// Hooks
import { useMarketStream } from './hooks/useMarketStream'
import { useWatchlist } from './hooks/useWatchlist'
import { useTradeExecution } from './hooks/useTradeExecution'
import { useSettingsData } from './hooks/useSettingsData'
import { useAuthHandlers } from './hooks/useAuthHandlers'

import './App.css'

ChartJS.register(CategoryScale, Filler, LinearScale, LineElement, PointElement, Tooltip)

function App() {
  const { t, i18n } = useTranslation()
  const { money, portfolioMoney, portfolioPnlClass } = createFormatters(i18n.language)

  // Store state & actions
  const accessToken = useAppStore((state) => state.accessToken)
  const userRole = useAppStore((state) => state.userRole)
  const stocks = useAppStore((state) => state.stocks)
  const portfolio = useAppStore((state) => state.portfolio)
  const selectedSymbol = useAppStore((state) => state.selectedSymbol)
  const authOpen = useAppStore((state) => state.authOpen)
  const error = useAppStore((state) => state.error)
  const setStocks = useAppStore((state) => state.setStocks)
  const setPortfolio = useAppStore((state) => state.setPortfolio)
  const updatePortfolioPrices = useAppStore((state) => state.updatePortfolioPrices)
  const setSelectedSymbol = useAppStore((state) => state.setSelectedSymbol)
  const setAuthOpen = useAppStore((state) => state.setAuthOpen)
  const setManageStocksOpen = useAppStore((state) => state.setManageStocksOpen)
  const setError = useAppStore((state) => state.setError)
  const setAccessToken = useAppStore((state) => state.setAccessToken)
  const setUserRole = useAppStore((state) => state.setUserRole)
  const logout = useAppStore((state) => state.logout)
  const manageStocksOpen = useAppStore((state) => state.manageStocksOpen)
  const isAdmin = userRole === 'admin'

  // Local state
  const [candles, setCandles] = useState([])
  const [activePage, setActivePage] = useState('dashboard')
  const [busy, setBusy] = useState(false)
  const [portfolioAnalytics, setPortfolioAnalytics] = useState(null)

  // Custom Hooks
  const watchlist = useWatchlist({ accessToken, t })
  const settings = useSettingsData({ manageStocksOpen, t })
  const auth = useAuthHandlers({ setAccessToken, setAuthOpen, t })

  async function refreshScan() {
    setBusy(true)
    setError('')
    try {
      const result = await apiRequest('/api/scan')
      setStocks(result.stocks || [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const trade = useTradeExecution({
    stocks,
    selectedSymbol,
    setSelectedSymbol,
    setPortfolio,
    refreshScan,
    busy,
    t,
  })

  // Real-time market stream WebSocket
  useMarketStream({
    accessToken,
    updatePortfolioPrices,
    setError,
    t,
  })

  // Initial Scan
  useEffect(() => {
    let active = true
    setError('')
    apiRequest('/api/scan')
      .then((result) => {
        if (active) {
          setStocks(result.stocks || [])
          if (result.stocks?.length && !result.stocks.some((item) => item.symbol === selectedSymbol)) {
            setSelectedSymbol(result.stocks[0].symbol)
          }
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
    return () => { active = false }
  }, [selectedSymbol, setError, setSelectedSymbol, setStocks])

  // Auth & Portfolio session
  useEffect(() => {
    if (!accessToken) {
      setPortfolio(null)
      setAuthOpen(true)
      return undefined
    }

    let active = true
    apiRequest('/api/auth/me')
      .then((profile) => {
        if (active) setUserRole(profile.role)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })

    apiRequest('/api/portfolio')
      .then((result) => {
        if (active) setPortfolio(result)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })

    apiRequest('/api/analytics/portfolio')
      .then((result) => {
        if (active) setPortfolioAnalytics(result)
      })
      .catch(() => {})

    return () => { active = false }
  }, [accessToken, setAuthOpen, setError, setPortfolio, setUserRole])

  // Candlestick historical charts
  useEffect(() => {
    if (!selectedSymbol) return undefined
    let active = true
    apiRequest(`/api/charts/${encodeURIComponent(selectedSymbol)}`)
      .then((result) => {
        if (active) setCandles(result.candles || [])
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
    return () => { active = false }
  }, [selectedSymbol, setError])

  function navigateToPage(page) {
    setActivePage(page)
    window.scrollTo(0, 0)
  }

  const selectedStock = stocks.find((stock) => stock.symbol === selectedSymbol)
  const buyCount = stocks.filter((stock) => stock.recommendation === 'BUY').length
  const chartData = {
    labels: candles.map((_, index) => index + 1),
    datasets: [{
      data: candles.map((candle) => candle.close),
      borderColor: '#1a9871',
      backgroundColor: 'rgba(26, 152, 113, 0.12)',
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 8,
      fill: true,
      tension: 0.18,
    }],
  }

  return (
    <div className="app-shell">
      <Sidebar
        accessToken={accessToken}
        activePage={activePage}
        navigateToPage={navigateToPage}
        t={t}
        watchlistCount={watchlist.watchlistSymbols.length}
      />

      <main className="main-panel" id="overview">
        <Topbar
          accessToken={accessToken}
          activePage={activePage}
          busy={busy}
          i18n={i18n}
          logout={logout}
          openAuth={() => setAuthOpen(true)}
          refreshScan={refreshScan}
          t={t}
        />

        {error && <div className="notice notice-error" role="alert">{error}</div>}

        {activePage === 'dashboard' && (
          <DashboardPage
            accessToken={accessToken}
            action={trade.action}
            addSymbolToWatchlist={watchlist.addSymbolToWatchlist}
            applySizing={trade.applySizing}
            busy={busy}
            buyCount={buyCount}
            calculateSizing={trade.calculateSizing}
            candles={candles}
            chartData={chartData}
            customStopLoss={trade.customStopLoss}
            money={money}
            portfolio={portfolio}
            portfolioMoney={portfolioMoney}
            quantity={trade.quantity}
            removeWatchlistSymbol={watchlist.removeWatchlistSymbol}
            riskPct={trade.riskPct}
            selectedStock={selectedStock}
            selectedSymbol={selectedSymbol}
            setAction={trade.setAction}
            setCustomStopLoss={trade.setCustomStopLoss}
            setQuantity={trade.setQuantity}
            setRiskPct={trade.setRiskPct}
            setSelectedSymbol={setSelectedSymbol}
            setTradeSymbol={trade.setTradeSymbol}
            sizingBusy={trade.sizingBusy}
            sizingResult={trade.sizingResult}
            stocks={stocks}
            submitTrade={trade.submitTrade}
            t={t}
            tradeMessage={trade.tradeMessage}
            tradeSymbol={trade.tradeSymbol}
            watchlistBusy={watchlist.watchlistBusy}
            watchlistLoadedToken={watchlist.watchlistLoadedToken}
            watchlistMessage={watchlist.watchlistMessage}
            watchlistSymbols={watchlist.watchlistSymbols}
          />
        )}

        {activePage === 'module1_ingestion' && (
          <IngestionPage
            candles={candles}
            chartData={chartData}
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={setSelectedSymbol}
            stocks={stocks}
            t={t}
          />
        )}

        {activePage === 'module2_signals' && (
          <SignalsPage
            navigateToPage={navigateToPage}
            selectedSymbol={selectedSymbol}
            setCustomStopLoss={trade.setCustomStopLoss}
            setCustomTakeProfit={trade.setCustomTakeProfit}
            setSelectedSymbol={setSelectedSymbol}
            setTradeSymbol={trade.setTradeSymbol}
            stocks={stocks}
          />
        )}

        {activePage === 'module3_risk' && (
          <RiskPage
            applySizing={trade.applySizing}
            calculateSizing={trade.calculateSizing}
            customStopLoss={trade.customStopLoss}
            customTakeProfit={trade.customTakeProfit}
            money={money}
            navigateToPage={navigateToPage}
            riskPct={trade.riskPct}
            selectedStock={selectedStock}
            setCustomStopLoss={trade.setCustomStopLoss}
            setCustomTakeProfit={trade.setCustomTakeProfit}
            setRiskPct={trade.setRiskPct}
            setSelectedSymbol={setSelectedSymbol}
            setTradeSymbol={trade.setTradeSymbol}
            sizingBusy={trade.sizingBusy}
            sizingResult={trade.sizingResult}
            stocks={stocks}
          />
        )}

        {activePage === 'module4_execution' && (
          <ExecutionPage
            accessToken={accessToken}
            action={trade.action}
            busy={busy}
            lastExecutionReport={trade.lastExecutionReport}
            money={money}
            notificationBusy={settings.notificationBusy}
            notificationMessage={settings.notificationMessage}
            quantity={trade.quantity}
            selectedStock={selectedStock}
            sendTestNotification={settings.sendTestNotification}
            setAction={trade.setAction}
            setAlertsOpen={settings.setAlertsOpen}
            setQuantity={trade.setQuantity}
            setTradeSymbol={trade.setTradeSymbol}
            submitTrade={trade.submitTrade}
            t={t}
            tradeMessage={trade.tradeMessage}
            tradeSymbol={trade.tradeSymbol}
          />
        )}

        {(activePage === 'module5_ledger' || activePage === 'portfolio' || activePage === 'analytics') && (
          <LedgerPage
            accessToken={accessToken}
            i18n={i18n}
            money={money}
            portfolio={portfolio}
            portfolioAnalytics={portfolioAnalytics}
            portfolioMoney={portfolioMoney}
            portfolioPnlClass={portfolioPnlClass}
            setAuthOpen={setAuthOpen}
            t={t}
          />
        )}

        {activePage === 'watchlist' && (
          <WatchlistPage
            accessToken={accessToken}
            addWatchlistSymbol={watchlist.addWatchlistSymbol}
            money={money}
            navigateToPage={navigateToPage}
            removeWatchlistSymbol={watchlist.removeWatchlistSymbol}
            selectStockForRisk={trade.selectStockForRisk}
            setAction={trade.setAction}
            setAuthOpen={setAuthOpen}
            setTradeSymbol={trade.setTradeSymbol}
            setWatchlistInput={watchlist.setWatchlistInput}
            stocks={stocks}
            t={t}
            watchlistBusy={watchlist.watchlistBusy}
            watchlistInput={watchlist.watchlistInput}
            watchlistMessage={watchlist.watchlistMessage}
            watchlistSymbols={watchlist.watchlistSymbols}
          />
        )}

        {activePage === 'settings' && (
          <SettingsPage
            accessToken={accessToken}
            isAdmin={isAdmin}
            setAlertsOpen={settings.setAlertsOpen}
            setAuthOpen={setAuthOpen}
            setConfigOpen={settings.setConfigOpen}
            setManageStocksOpen={setManageStocksOpen}
            setWatchlistOpen={watchlist.setWatchlistOpen}
            t={t}
          />
        )}
      </main>

      <AuthModal
        authMessage={auth.authMessage}
        authMode={auth.authMode}
        authOpen={authOpen}
        busy={auth.authBusy}
        setAuthMessage={auth.setAuthMessage}
        setAuthMode={auth.setAuthMode}
        setAuthOpen={setAuthOpen}
        submitAuth={auth.submitAuth}
        t={t}
      />

      <ManageStocksModal
        busy={settings.busy}
        deleteStock={settings.deleteStock}
        manageStocksOpen={manageStocksOpen}
        newStockSymbol={settings.newStockSymbol}
        rawStocks={settings.rawStocks}
        setManageStocksOpen={setManageStocksOpen}
        setNewStockSymbol={settings.setNewStockSymbol}
        stockMessage={settings.stockMessage}
        submitAddStock={settings.submitAddStock}
        t={t}
      />

      <ConfigModal
        configBusy={settings.configBusy}
        configMessage={settings.configMessage}
        configOpen={settings.configOpen}
        maxStocks={settings.maxStocks}
        setConfigOpen={settings.setConfigOpen}
        setMaxStocks={settings.setMaxStocks}
        submitConfig={settings.submitConfig}
        t={t}
      />

      <WatchlistModal
        addWatchlistSymbol={watchlist.addWatchlistSymbol}
        removeWatchlistSymbol={watchlist.removeWatchlistSymbol}
        setWatchlistInput={watchlist.setWatchlistInput}
        setWatchlistOpen={watchlist.setWatchlistOpen}
        stocks={stocks}
        t={t}
        watchlistBusy={watchlist.watchlistBusy}
        watchlistInput={watchlist.watchlistInput}
        watchlistMessage={watchlist.watchlistMessage}
        watchlistOpen={watchlist.watchlistOpen}
        watchlistSymbols={watchlist.watchlistSymbols}
      />

      <AlertsModal
        alertsOpen={settings.alertsOpen}
        disconnectNotifications={settings.disconnectNotifications}
        lineChannelAccessToken={settings.lineChannelAccessToken}
        lineConfigured={settings.lineConfigured}
        lineUserId={settings.lineUserId}
        notificationBusy={settings.notificationBusy}
        notificationMessage={settings.notificationMessage}
        saveNotificationSettings={settings.saveNotificationSettings}
        sendTestNotification={settings.sendTestNotification}
        setAlertsOpen={settings.setAlertsOpen}
        setLineChannelAccessToken={settings.setLineChannelAccessToken}
        setLineUserId={settings.setLineUserId}
        t={t}
      />
    </div>
  )
}

export default App
