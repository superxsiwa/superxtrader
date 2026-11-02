import { MetricsSummary } from '../components/dashboard/MetricsSummary'
import { InteractiveChart } from '../components/dashboard/InteractiveChart'
import { QuickTradePanel } from '../components/dashboard/QuickTradePanel'
import { OpportunitiesTable } from '../components/dashboard/OpportunitiesTable'

export function DashboardPage({
  stocks,
  portfolio,
  candles,
  chartData,
  selectedSymbol,
  setSelectedSymbol,
  selectedStock,
  buyCount,
  tradeSymbol,
  setTradeSymbol,
  quantity,
  setQuantity,
  action,
  setAction,
  submitTrade,
  tradeMessage,
  accessToken,
  busy,
  customStopLoss,
  setCustomStopLoss,
  riskPct,
  setRiskPct,
  calculateSizing,
  sizingBusy,
  sizingResult,
  applySizing,
  watchlistSymbols,
  watchlistLoadedToken,
  watchlistBusy,
  watchlistMessage,
  addSymbolToWatchlist,
  removeWatchlistSymbol,
  money,
  portfolioMoney,
  t,
}) {
  return (
    <>
      <MetricsSummary
        buyCount={buyCount}
        money={money}
        portfolio={portfolio}
        portfolioMoney={portfolioMoney}
        stocksCount={stocks.length}
        t={t}
      />

      <section className="work-grid">
        <InteractiveChart
          candles={candles}
          chartData={chartData}
          money={money}
          selectedStock={selectedStock}
          selectedSymbol={selectedSymbol}
          t={t}
        />

        <QuickTradePanel
          accessToken={accessToken}
          action={action}
          applySizing={applySizing}
          busy={busy}
          calculateSizing={calculateSizing}
          customStopLoss={customStopLoss}
          money={money}
          quantity={quantity}
          riskPct={riskPct}
          selectedStock={selectedStock}
          setAction={setAction}
          setCustomStopLoss={setCustomStopLoss}
          setQuantity={setQuantity}
          setRiskPct={setRiskPct}
          setTradeSymbol={setTradeSymbol}
          sizingBusy={sizingBusy}
          sizingResult={sizingResult}
          submitTrade={submitTrade}
          t={t}
          tradeMessage={tradeMessage}
          tradeSymbol={tradeSymbol}
        />
      </section>

      <OpportunitiesTable
        accessToken={accessToken}
        addSymbolToWatchlist={addSymbolToWatchlist}
        removeWatchlistSymbol={removeWatchlistSymbol}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        stocks={stocks}
        t={t}
        watchlistBusy={watchlistBusy}
        watchlistLoadedToken={watchlistLoadedToken}
        watchlistMessage={watchlistMessage}
        watchlistSymbols={watchlistSymbols}
      />
    </>
  )
}
