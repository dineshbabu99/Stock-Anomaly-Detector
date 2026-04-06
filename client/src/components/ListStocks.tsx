import axios from 'axios';
import { useState } from 'react';

type SpikeAlert = {
  strategy: 'spike';
  thresholdPercent: number;
  windowSec: number;
};

type MovingAverageAlert = {
  strategy: 'movingAverage';
  deviationPercent: number;
  sampleSize: number;
};

type Alert = SpikeAlert | MovingAverageAlert;

type Stock = {
  symbol: string;
  price: number;
  change: number;
  alert: Alert | null;
};

type Props = {
  stocks: Stock[];
  onUpdateAlert: (symbol: string, alert: Alert | null) => void;
  onSelectStock: (symbol: string) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
   total: number;
};





const ListStocks = ({ stocks, onUpdateAlert, onSelectStock, page, setPage, total }: Props) => {
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [tempAlert, setTempAlert] = useState<Alert | null>(null);


const totalPages = Math.ceil(total / 10);



  const handleRemove = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click triggering onSelectStock
    try {
      await axios.delete(`http://localhost:4000/stocks/${symbol}/alert`);
      onUpdateAlert(symbol, null);
      if (editingStock === symbol) {
        setEditingStock(null);
        setTempAlert(null);
      }
    } catch (err) {
      console.error("Failed to remove alert", err);
    }
  };

  const handleEdit = (stock: Stock, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click
    setEditingStock(stock.symbol);
    setTempAlert(stock.alert ? { ...stock.alert } : {
      strategy: 'spike',
      thresholdPercent: 0,
      windowSec: 0
    });
  };

  const handleStrategyChange = (strategy: Alert['strategy']) => {
    setTempAlert(strategy === 'spike'
      ? { strategy: 'spike', thresholdPercent: 0, windowSec: 0 }
      : { strategy: 'movingAverage', deviationPercent: 0, sampleSize: 0 }
    );
  };

  const handleSave = async () => {
    if (!tempAlert || !editingStock) return;
    try {
      await axios.put(`http://localhost:4000/stocks/${editingStock}/alert`, tempAlert);
      onUpdateAlert(editingStock, tempAlert);
      setEditingStock(null);
      setTempAlert(null);
    } catch (err) {
      console.error("Failed to update alert", err);
    }
  };

  return (
    <div className="list-stocks">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change</th>
            <th>Alert</th>

            <th>Remove Alert</th>
          </tr>
        </thead>
        <tbody>
          {stocks?.map(stock => (
            <tr key={stock.symbol} onClick={() => onSelectStock(stock.symbol)}>
              <td>{stock.alert ? ' Active' : ' Not Set'}</td>
              <td className="symbol">{stock.symbol}</td>
              <td>${stock.price.toFixed(2)}</td>
              <td className={(stock.change ?? 0) >= 0 ? 'up' : 'down'}>
                {(stock.change ?? 0) >= 0 ? '+' : ''}
                {(stock.change ?? 0).toFixed(2)}%
              </td>
              <td>
                <button
                  className={`btn-alert ${stock.alert ? 'active' : ''}`}
                  onClick={(e) => handleEdit(stock, e)}
                >
                  {stock.alert ? 'Edit Alert' : 'Set Alert'}
                </button>
              </td>
              <td>
                <button
                  className="btn-remove"
                  onClick={(e) => handleRemove(stock.symbol, e)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        
        </tbody>
        
      </table>
<div style={{ marginTop: "10px" }}>
  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
    Prev
  </button>

  <span style={{ margin: "0 10px" }}>
    Page {page} / {totalPages}
  </span>

  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
    Next
  </button>
</div>
      {editingStock && tempAlert && (
        <div className="edit-box">
          <h3>Edit Alert — {editingStock}</h3>

          <div className="field">
            <label>Strategy</label>
            <select
              value={tempAlert.strategy}
              onChange={e => handleStrategyChange(e.target.value as Alert['strategy'])}
            >
              <option value="spike">Spike</option>
              <option value="movingAverage">Moving Average</option>
            </select>
          </div>

          {tempAlert.strategy === 'spike' && (
            <>
              <div className="field">
                <label>Threshold %</label>
                <input
                  type="number"
                  value={tempAlert.thresholdPercent}
                  onChange={e => setTempAlert({ ...tempAlert, thresholdPercent: +e.target.value })}
                />
              </div>
              <div className="field">
                <label>Window Sec</label>
                <input
                  type="number"
                  value={tempAlert.windowSec}
                  onChange={e => setTempAlert({ ...tempAlert, windowSec: +e.target.value })}
                />
              </div>
            </>
          )}

          {tempAlert.strategy === 'movingAverage' && (
            <>
              <div className="field">
                <label>Deviation %</label>
                <input
                  type="number"
                  value={tempAlert.deviationPercent}
                  onChange={e => setTempAlert({ ...tempAlert, deviationPercent: +e.target.value })}
                />
              </div>
              <div className="field">
                <label>Sample Size</label>
                <input
                  type="number"
                  value={tempAlert.sampleSize}
                  onChange={e => setTempAlert({ ...tempAlert, sampleSize: +e.target.value })}
                />
              </div>
            </>
          )}

          <div className="edit-actions">
            <button className="btn-save" onClick={handleSave}>Save</button>
            <button className="btn-cancel" onClick={() => { setEditingStock(null); setTempAlert(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        .list-stocks {
          padding: 16px;
          background: var(--bg2, #111);
          border: 1px solid var(--border, #333);
          border-radius: 8px;
          color: white;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 8px 12px;
          border-bottom: 1px solid var(--border, #333);
          font-size: 12px;
          text-align: left;
        }

        th {
          background: var(--bg3, #1a1a1a);
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: var(--text3, #666);
        }

        tr { cursor: pointer; }
        tr:hover td { background: var(--bg3, #1a1a1a); }

        .symbol { font-weight: 700; }
        .up { color: var(--green, #4caf50); }
        .down { color: var(--red, #f44336); }

        .btn-alert {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid var(--text3, #666);
          color: var(--text3, #666);
          background: transparent;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .btn-alert.active {
          border-color: var(--amber, #ffb020);
          color: var(--amber, #ffb020);
        }

        .btn-alert:hover { opacity: 0.7; }

        .btn-remove {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid var(--red, #f44336);
          color: var(--red, #f44336);
          background: transparent;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .btn-remove:hover { opacity: 0.7; }

        .edit-box {
          display: inline-block;
          margin-top: 12px;
          padding: 16px;
          border: 1px solid var(--border, #444);
          border-radius: 8px;
          background: var(--bg3, #1a1a1a);
        }

        .edit-box h3 {
          margin: 0 0 12px;
          font-size: 13px;
          color: var(--text, white);
        }

        .field {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .field label {
          font-size: 11px;
          color: var(--text3, #888);
          width: 100px;
          flex-shrink: 0;
        }

        .field input, .field select {
          background: var(--bg2, #111);
          border: 1px solid var(--border, #444);
          border-radius: 4px;
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          width: 120px;
        }

        .edit-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 14px;
        }

        .btn-save {
          font-size: 11px;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 4px;
          border: 1px solid var(--green, #4caf50);
          color: var(--green, #4caf50);
          background: transparent;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .btn-save:hover { opacity: 0.7; }

        .btn-cancel {
          font-size: 11px;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 4px;
          border: 1px solid var(--text3, #666);
          color: var(--text3, #666);
          background: transparent;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .btn-cancel:hover { opacity: 0.7; }
      `}</style>
    </div>
  );
};

export default ListStocks;