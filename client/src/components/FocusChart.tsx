import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { CartesianGrid } from 'recharts';


type FocusChartProps = {
  symbol: string;
  history: { t: number; price: number }[];
  alerts: { symbol: string; timestamp: number; strategy: string; reason: string }[];
}

function FocusChart({ symbol, history, alerts }: FocusChartProps) {
  // console.log(symbol)
  const data = useMemo(() => {
    if (!history?.length) return [];

    return history.map((h) => ({
      t: h.t,
      price: h.price,
      alert: alerts.some(
        a =>
          a.symbol === symbol &&
          Math.abs(new Date(a.timestamp).getTime() - h.t) < 2000
      )
        ? h.price
        : null,
    }));
  }, [history, alerts, symbol]);

  const symbolAlerts = alerts.filter(a => a.symbol === symbol).slice(0, 3);

  const domain = useMemo(() => {
    if (!data.length) return ['auto', 'auto'];
    const vals = data.map(d => d.price);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.4 || 1;
    return [min - pad, max + pad];
  }, [data]);

  return (
    <div className="focus-chart">
      <div className="fc-header">
        <span className="fc-symbol">{symbol}</span>
        <span className="fc-label">Price History</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--green)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tickFormatter={(t) =>
              new Date(t).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })
            }
            stroke="var(--text3)"
            fontSize={10}
          />

          <YAxis
            domain={domain}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            stroke="var(--text3)"
            fontSize={10}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;

              const price = payload[0]?.value;
              const time = payload[0]?.payload?.t;

              return (
                <div style={{
                  background: 'var(--bg3)',
                  border: '1px solid var(--border2)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                }}>
                  <div> Price: {Number(price)?.toFixed(2)}</div>
                  <div>{new Date(time).toLocaleTimeString()}</div>
                </div>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="price"
            stroke="var(--green)"
            strokeWidth={1.5}
            fill="url(#priceGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <style>{`
        .focus-chart {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 16px;
        }
        .fc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .fc-symbol {
          font-family: var(--font-head);
          font-weight: 800;
          font-size: 18px;
          color: var(--text);
        }
        .fc-label {
          font-size: 10px;
          color: var(--text3);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .fc-alerts {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .fc-alert-chip {
          font-size: 10px;
          color: var(--amber);
          background: var(--amber-dim);
          border-radius: 3px;
          padding: 3px 8px;
          line-height: 1.4;
          animation: fade-in 0.3s ease;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default FocusChart;