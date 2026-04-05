import { useEffect, useRef } from 'react';

interface Alert {
  id?: string;
  symbol: string;
  timestamp: string;
  price?: number;
  reason?: string;
  type: 'SPIKE' | 'DROP' | 'ABOVE_AVG' | 'BELOW_AVG';
}

interface AlertFeedProps {
  alerts: Alert[];
  onClear?: () => void;
}

function AlertFeed({ alerts, onClear }: AlertFeedProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef<number>(0);

  useEffect(() => {
    if (alerts.length > prevCountRef.current && listRef.current) {
      listRef.current.scrollTop = 0;
    }
    prevCountRef.current = alerts.length;
  }, [alerts.length]);

  return (
    <div className="alert-feed">
      <div className="feed-header">
        <span className="feed-title">Alert Feed</span>
        <span className="feed-count">{alerts.length} alerts</span>
        <span className="sep">|</span>
        <button className="btn-remove" onClick={() => {
          if (window.confirm('Clear all alerts?')) {
            onClear?.();
          }
        }}>
          Clear Alerts
        </button>
      </div>

      <div className="feed-list" ref={listRef}>
        {alerts.length === 0 ? (
          <div className="feed-empty">Monitoring for anomalies...</div>
        ) : (
          alerts.map((a, i) => (
            <AlertRow
              key={a.id || `${a.symbol}-${a.timestamp}`}
              alert={a}
              isNew={i === 0}
            />
          ))
        )}
      </div>

      <style>{`
        .alert-feed {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          height: 100%;
        }
        .feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .feed-title {
          font-family: var(--font-head);
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text2);
        }
        .feed-count {
          font-size: 11px;
          color: var(--text3);
        }
        .feed-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px;
        }
        .feed-empty {
          padding: 24px 0;
          color: var(--text3);
          font-size: 12px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

interface AlertRowProps {
  alert: Alert;
  isNew?: boolean;
}

function AlertRow({ alert, isNew }: AlertRowProps) {
  const strategyLabel =
    alert.type === 'SPIKE' ? 'SPIKE' :
      alert.type === 'DROP' ? 'DROP' :
        alert.type === 'ABOVE_AVG' ? 'ABOVE AVG' : 'BELOW AVG';

  const strategyColor =
    alert.type === 'SPIKE' || alert.type === 'ABOVE_AVG' ? 'var(--red)' :
      'var(--blue)';

  return (
    <div className={`alert-row`}>
      <div className="alert-row-left">
        <span className="alert-symbol">{alert.symbol}</span>
        <span className="alert-strat" style={{ color: strategyColor, borderColor: strategyColor }}>
          {strategyLabel}
        </span>

      </div>
      <div className="alert-reason">{alert.reason}</div>
      <div className="alert-meta">
        <span className="alert-price">${alert.price}</span>
        <span className="alert-time">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>

      </div>
      <style>{`
        .alert-row {
          border-bottom: 1px solid var(--border);
          padding: 10px 0;
          animation: slide-in 0.3s ease;
        }
        .alert-row.is-new {
          background: linear-gradient(90deg, rgba(255,176,32,0.05) 0%, transparent 100%);
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .alert-row-left {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }
        .alert-symbol {
          font-family: var(--font-head);
          font-weight: 700;
          font-size: 13px;
          color: var(--text);
        }
        .alert-strat {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.1em;
          border: 1px solid;
          border-radius: 3px;
          padding: 1px 4px;
        }
        .alert-reason {
          font-size: 11px;
          color: var(--text2);
          margin-bottom: 4px;
          line-height: 1.4;
        }
        .alert-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .alert-price { color: var(--amber); font-weight: 500; }
        .alert-time { color: var(--text3); }

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
      `}</style>
    </div>
  );
}

export default AlertFeed;
