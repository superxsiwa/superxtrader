import { Line } from 'react-chartjs-2'

export function InteractiveChart({
  selectedSymbol,
  selectedStock,
  candles,
  chartData,
  money,
  t,
}) {
  return (
    <article className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t('chart.eyebrow')}</p>
          <h2>{selectedSymbol || t('chart.selectSymbol')}</h2>
        </div>
        <span className={`signal-tag ${selectedStock?.recommendation?.toLowerCase() || 'watch'}`}>
          {t(`signals.${selectedStock?.recommendation || 'WATCH'}`)}
        </span>
      </div>
      {candles.length ? (
        <div className="chart-wrap">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
              scales: {
                x: { display: false, grid: { display: false } },
                y: {
                  border: { display: false },
                  grid: { color: '#e7ece8' },
                  ticks: { color: '#77817b', maxTicksLimit: 5 },
                },
              },
            }}
          />
        </div>
      ) : (
        <div className="chart-empty">{t('chart.empty')}</div>
      )}
      <div className="chart-footer">
        <span>{t('chart.period')}</span>
        <span>
          {candles.length
            ? t('chart.latestClose', { price: money.format(candles.at(-1).close) })
            : t('chart.noData')}
        </span>
      </div>
    </article>
  )
}

