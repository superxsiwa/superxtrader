export function ManageStocksModal({
  manageStocksOpen,
  setManageStocksOpen,
  newStockSymbol,
  setNewStockSymbol,
  submitAddStock,
  stockMessage,
  rawStocks,
  deleteStock,
  busy,
  t,
}) {
  if (!manageStocksOpen) return null

  return (
    <div className="dialog-backdrop" role="presentation">
      <section aria-labelledby="manage-stocks-title" aria-modal="true" className="auth-dialog" role="dialog" style={{ maxWidth: '500px' }}>
        <p className="eyebrow">Settings</p>
        <h2 id="manage-stocks-title">Manage Stocks</h2>
        <form className="trade-form" onSubmit={submitAddStock} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            maxLength="15"
            onChange={(e) => setNewStockSymbol(e.target.value)}
            value={newStockSymbol}
            required
            placeholder="e.g. GULF.BK"
            style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button className="button button-primary" disabled={busy} type="submit">Add</button>
        </form>
        <p className="form-message" role="status" style={{ color: stockMessage.includes('Cannot') ? 'red' : 'inherit' }}>
          {stockMessage}
        </p>
        <div className="table-scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ paddingBottom: '8px', borderBottom: '1px solid #eee' }}>Symbol</th>
                <th style={{ paddingBottom: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rawStocks.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <strong>{s.symbol}</strong>
                  </td>
                  <td style={{ padding: '8px 0', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                    <button
                      className="text-button"
                      onClick={() => deleteStock(s.id)}
                      type="button"
                      style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dialog-actions" style={{ marginTop: '16px' }}>
          <button className="button button-quiet" onClick={() => setManageStocksOpen(false)} type="button">
            {t('actions.close')}
          </button>
        </div>
      </section>
    </div>
  )
}

