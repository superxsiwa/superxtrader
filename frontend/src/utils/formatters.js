export function createFormatters(language) {
  const isThai = language === 'th'
  const locale = isThai ? 'th-TH' : 'en-US'

  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  })

  const portfolioMoney = (value, unavailableText = 'N/A') => (
    Number.isFinite(value) ? money.format(value) : unavailableText
  )

  const portfolioPnlClass = (value) => (
    typeof value === 'number' && Number.isFinite(value)
      ? value >= 0 ? 'pnl-positive' : 'pnl-negative'
      : ''
  )

  return { money, portfolioMoney, portfolioPnlClass }
}

