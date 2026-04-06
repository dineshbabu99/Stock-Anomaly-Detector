import AlertFeed from "../components/AlertFeed";
import FocusChart from "../components/FocusChart";
import ListStocks from "../components/ListStocks";
import { useEffect, useMemo, useState, useRef } from "react";


function Dashboard() {

  type Stock = {
    symbol: string;
    price: number;
    change: number;
    alert: any;
  };



  const [alerts, setAlerts] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [isconnected, setIsConnected] = useState(false);
  const [historyMap, setHistoryMap] = useState<Record<string, any[]>>({});
  const [selectedSymbol, setSelectedSymbol] = useState("TAA");
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [page, setPage] = useState(1);





const limit = 10;

const wsRef = useRef<WebSocket | null>(null);
const symbolsRef = useRef<string[]>([]);

const paginatedSymbols = useMemo(() => {
  const start = (page - 1) * limit;
  return allSymbols.slice(start, start + limit);
}, [page, allSymbols]);

useEffect(() => {
  symbolsRef.current = paginatedSymbols;
}, [paginatedSymbols]);

  const handleUpdateAlert = (symbol: string, alert: any) => {
    setStocks(prev =>
      prev.map(s =>
        s.symbol === symbol ? { ...s, alert } : s
      )
    );
  };
  useEffect(() => {
   
    let reconnectTimer: any;
    let retry = 0;

    const connect = () => {
      wsRef.current = new WebSocket(
        "ws://localhost:4000/stocks?token=dinesh-key-123"
      );
      wsRef.current.onopen = () => {
        retry = 0;
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "ALERT") {
          console.log(msg.type)
          const alertFromBackend = msg.data;
          const newAlert = {
            symbol: alertFromBackend.symbol,
            price: alertFromBackend.price,
            timestamp: new Date().toISOString(),
            type: alertFromBackend.type,
            value: alertFromBackend.percent || alertFromBackend.deviation
          };

          setAlerts(prev => [newAlert, ...prev].slice(0, 10));
          return;
        }

        if (msg.type === "ALERT_HISTORY") {
          setAlerts(prev => {
            const combined = [...msg.data, ...prev];
            const map = new Map(combined.map(a => [a.id, a]));
            return Array.from(map.values()).slice(0, 10);
          });
        }

        if (msg.type === "PRICE_UPDATE") {
          const list: Stock[] = msg.data;
// console.log(paginatedSymbols)
      const filtered = list.filter(stock =>
symbolsRef.current.includes(stock.symbol)
  );

  setStocks(filtered);
          const focusedStocks = list;

          setHistoryMap(prev => {
            const updated = { ...prev };

            focusedStocks.forEach(stock => {
              if (!updated[stock.symbol]) {
                updated[stock.symbol] = [];
              }

              updated[stock.symbol] = [
                ...updated[stock.symbol],
                {
                  t: Date.now(),
                  price: stock.price
                }
              ].slice(-60); 
            });

            return updated;
          });
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);

        const delay = Math.min(2000 * (retry + 1), 10000);
        retry++;

        reconnectTimer = setTimeout(connect, delay);
      };

      wsRef.current.onerror = () => {
        wsRef.current?.close();
      };

   
    };

    connect();



    return () => {
   if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.close();
  }
      clearTimeout(reconnectTimer);
    };
  }, []);

useEffect(() => {
if (wsRef.current?.readyState !== WebSocket.OPEN) return;

  wsRef.current?.send(JSON.stringify({
    type: "WATCH",
    symbols: paginatedSymbols
  }));
}, [page, paginatedSymbols, isconnected]);


useEffect(() => {
  fetch("http://localhost:4000/stocks?page=1&limit=1000")
    .then(res => res.json())
    .then(data => {
      setAllSymbols(data.data.map((s: any) => s.symbol));
    });
}, []);


  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <span className="logo">◈</span>
          <span className="header-title">ANOMALY DETECTOR</span>
        </div>
      </header>

  <div className="status-bar">
      <div className="status-left">
        <span className={`dot ${isconnected ? 'green' : 'red'}`} />
        <span>{isconnected ? 'LIVE' : 'RECONNECTING'}</span>

      </div>
      </div>
      
      <div className="main-layout">
        <div className="left-pane">
         <ListStocks
  stocks={stocks}
  onUpdateAlert={handleUpdateAlert}
  onSelectStock={setSelectedSymbol}
  page={page}
  setPage={setPage}
    total={allSymbols.length}
/>
          <FocusChart symbol={selectedSymbol} history={historyMap[selectedSymbol] || []} alerts={alerts} />
        </div>

        <div className="right-pane">
          <AlertFeed
            alerts={alerts}
            onClear={() => setAlerts([])}
          />
        </div>
         <style>{`
        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 20px;
          background: var(--bg2);
          border-bottom: 1px solid var(--border);
          font-size: 11px;
          color: var(--text2);
          letter-spacing: 0.05em;
          font-family: var(--font-mono);
        }
        .status-left, .status-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }
        .dot.green {
          background: var(--green);
          box-shadow: 0 0 6px var(--green);
          animation: blink 2s ease-in-out infinite;
        }
        .dot.red { background: var(--red); }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .sep { color: var(--border2); }
      `}</style>
      </div>
    </>
  )
}

export default Dashboard
