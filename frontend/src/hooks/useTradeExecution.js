import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

export function useTradeExecution({
  stocks,
  selectedSymbol,
  setSelectedSymbol,
  setPortfolio,
  refreshScan,
  busy,
  t,
}) {
  const [quantity, setQuantity] = useState('50')
  const [action, setAction] = useState('BUY')
  const [tradeSymbol, setTradeSymbol] = useState('AOT')
  const [tradeMessage, setTradeMessage] = useState('')
  const [customStopLoss, setCustomStopLoss] = useState('')
  const [customTakeProfit, setCustomTakeProfit] = useState('')
  const [riskPct, setRiskPct] = useState(0.01)
  const [sizingResult, setSizingResult] = useState(null)
  const [sizingBusy, setSizingBusy] = useState(false)
  const [lastExecutionReport, setLastExecutionReport] = useState(null)

  useEffect(() => {
    if (selectedSymbol) {
      setTradeSymbol(selectedSymbol)
      const st = stocks.find((s) => s.symbol === selectedSymbol)
      if (st) {
        setCustomStopLoss(st.suggested_stop_loss ? String(st.suggested_stop_loss) : '')
        setCustomTakeProfit(st.suggested_take_profit ? String(st.suggested_take_profit) : '')
        setSizingResult(null)
      }
    }
  }, [selectedSymbol, stocks])

  async function calculateSizing(overrideRisk) {
    if (!tradeSymbol) return
    setSizingBusy(true)
    try {
      const activeRisk = overrideRisk !== undefined ? overrideRisk : riskPct
      const st = stocks.find((s) => s.symbol === tradeSymbol.trim().toUpperCase())
      const payload = {
        symbol: tradeSymbol.trim().toUpperCase(),
        entry_price: st?.price ? Number(st.price) : undefined,
        stop_loss_price: customStopLoss
          ? Number(customStopLoss)
          : (st?.suggested_stop_loss ? Number(st.suggested_stop_loss) : undefined),
        take_profit_price: customTakeProfit
          ? Number(customTakeProfit)
          : (st?.suggested_take_profit ? Number(st.suggested_take_profit) : undefined),
        risk_pct_per_trade: Number(activeRisk),
      }
      const res = await apiRequest('/api/risk/calculate-sizing', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setSizingResult(res)
      if (res.stop_loss_price && !customStopLoss) setCustomStopLoss(String(res.stop_loss_price))
      if (res.take_profit_price && !customTakeProfit) setCustomTakeProfit(String(res.take_profit_price))
    } catch (err) {
      console.error(err)
    } finally {
      setSizingBusy(false)
    }
  }

  function applySizing() {
    if (sizingResult?.recommended_qty) {
      setQuantity(String(sizingResult.recommended_qty))
      setAction('BUY')
    }
  }

  async function submitTrade(event) {
    event.preventDefault()
    setTradeMessage('')
    try {
      const selectedStock = stocks.find((s) => s.symbol === tradeSymbol.trim().toUpperCase())
      const result = await apiRequest('/api/paper-trade', {
        method: 'POST',
        body: JSON.stringify({
          symbol: tradeSymbol.trim().toUpperCase(),
          action,
          quantity: Number(quantity),
          strategy_tag: selectedStock?.strategy_name || 'MANUAL',
          stop_loss_price: customStopLoss ? Number(customStopLoss) : undefined,
          take_profit_price: customTakeProfit ? Number(customTakeProfit) : undefined,
        }),
      })
      const actionLabel = action === 'BUY' ? t('trade.buy') : t('trade.sell')
      setTradeMessage(result.message || t('trade.success', {
        action: actionLabel,
        quantity,
        symbol: tradeSymbol.trim().toUpperCase(),
      }))
      if (result.execution) {
        setLastExecutionReport(result.execution)
      }
      setPortfolio(result.portfolio)
      await refreshScan()
    } catch (requestError) {
      setTradeMessage(requestError.message)
    }
  }

  function selectStockForRisk(stock) {
    if (!stock) return
    setSelectedSymbol(stock.symbol)
    setTradeSymbol(stock.symbol)
    if (stock.suggested_stop_loss) setCustomStopLoss(String(stock.suggested_stop_loss))
    if (stock.suggested_take_profit) setCustomTakeProfit(String(stock.suggested_take_profit))
  }

  return {
    quantity,
    setQuantity,
    action,
    setAction,
    tradeSymbol,
    setTradeSymbol,
    tradeMessage,
    setTradeMessage,
    customStopLoss,
    setCustomStopLoss,
    customTakeProfit,
    setCustomTakeProfit,
    riskPct,
    setRiskPct,
    sizingResult,
    sizingBusy,
    lastExecutionReport,
    calculateSizing,
    applySizing,
    submitTrade,
    selectStockForRisk,
  }
}

