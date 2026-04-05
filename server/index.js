const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const stocks = require("./config");
const { type } = require("os");

const app = express();

app.use(cors({
  origin: "http://localhost:3000"
}));

app.use(express.json());

const PORT = 4000;

const symbols = ['AAPL', 'GOOGL', 'AMZN', 'MSFT', 'TSLA'];

const priceHistory = {};
const lastAlertTime = {};
const priceStore = {};
const alertsConfig = {};
const alertsQueue = [];
let alertID = 1;


app.get("/stocks", (req, res) => {
  res.json(stocks);
});

app.get("/alerts", (req, res) => {
  // console.log("Current alerts queue:", alertsQueue);
  res.json({
    count: alertsQueue.length,
    alerts: alertsQueue.slice(-10).reverse()
  });
});

app.put("/stocks/:symbol/alert", (req, res) => {
  const { symbol } = req.params;
  const newAlert = req.body;

  const stock = stocks.find(s => s.symbol === symbol);

  if (!stock) {
    return res.status(404).json({ message: "Stock not found" });
  }

  let cleanAlert;

  if (newAlert.strategy === "spike") {
    cleanAlert = {
      strategy: "spike",
      thresholdPercent: Number(newAlert.thresholdPercent),
      windowSec: Number(newAlert.windowSec),
    };
  } else if (newAlert.strategy === "movingAverage") {
    cleanAlert = {
      strategy: "movingAverage",
      deviationPercent: Number(newAlert.deviationPercent),
      sampleSize: Number(newAlert.sampleSize),
    };
  } else {
    return res.status(400).json({ message: "Invalid strategy" });
  }

  alertsConfig[symbol] = cleanAlert;
  stock.alert = cleanAlert;





  res.json({
    message: "Alert updated successfully",
    stock
  });
});

app.delete("/stocks/:symbol/alert", (req, res) => {
  const { symbol } = req.params;

  const stock = stocks.find(s => s.symbol === symbol);

  if (!stock) {
    return res.status(404).json({ message: "Stock not found" });
  }

  stock.alert = null;
  delete alertsConfig[symbol];
  delete priceHistory[symbol];
  delete lastAlertTime[symbol];

  res.json({
    message: "Alert removed successfully",
    symbol
  });
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server, path: "/stocks" });

wss.on("connection", (ws, req) => {

  const url = new URL(req.url, "http://localhost");
  const token = url.searchParams.get("token");

  if (token !== "dinesh-key-123") {
    ws.close();
    return;
  }


  const interval = setInterval(() => {
    const data = symbols.map(symbol => {
      let change = (Math.random() * 10 - 5);

      if (Math.random() > 0.95) {
        change = (Math.random() * 40 - 20);
      }
      const oldPrice = priceStore[symbol] || (Math.random() * 3000 + 100);

      const newPrice = +(oldPrice * (1 + change / 100)).toFixed(2);

      priceStore[symbol] = newPrice;



      return {
        symbol,
        price: newPrice,
        timestamp: new Date()
      };
    });
    data.forEach((liveStock) => {
      const stock = stocks.find(s => s.symbol === liveStock.symbol);
      if (!stock) return;
      if (!priceHistory[stock.symbol]) {
        priceHistory[stock.symbol] = [];
      }

      priceHistory[stock.symbol].push(liveStock.price);
      priceHistory[stock.symbol] = priceHistory[stock.symbol].slice(-50);

      const oldPrice = stock.price;

      stock.price = liveStock.price;

      if (!oldPrice || oldPrice === 0) {
        stock.change = 0;
      } else {
        stock.change = +(
          ((liveStock.price - oldPrice) / oldPrice) * 100
        ).toFixed(2);
      }
      const config = alertsConfig[stock.symbol];
      // console.log(alertsConfig);

      const alertResult = checkAlert(config, priceHistory[stock.symbol]);

      if (alertResult) {
        const now = Date.now();

        if (
          !lastAlertTime[stock.symbol] ||
          now - lastAlertTime[stock.symbol] > 10000
        ) {
          lastAlertTime[stock.symbol] = now;

          let reason = "";

          if (alertResult.type === "SPIKE" || alertResult.type === "DROP") {
            reason = `Price moved ${alertResult.type === "SPIKE" ? "up" : "down"
              } ${Math.abs(alertResult.percent).toFixed(2)}% in ${config.windowSec
              }s (threshold: ${config.thresholdPercent}%)`;
          }

          if (alertResult.type === "ABOVE_AVG" || alertResult.type === "BELOW_AVG") {
            reason = `Price ${alertResult.type === "ABOVE_AVG" ? "above" : "below"
              } average by ${Math.abs(alertResult.deviation).toFixed(2)}% (sample: ${config.sampleSize
              }, threshold: ${config.deviationPercent}%)`;
          }

          alertsQueue.push({
            id: alertID++,
            symbol: stock.symbol,
            price: stock.price,
            type: alertResult.type,
            reason: reason,
            value: alertResult.percent || alertResult.deviation,
            timestamp: new Date().toISOString()
          });

          if (alertsQueue.length > 10) {
            alertsQueue.shift();
          }


          ws.send(JSON.stringify({
            type: "ALERT",
            data: {
              symbol: stock.symbol,
              price: stock.price,
              ...alertResult,


            },
          }));
          ws.send(JSON.stringify({
            type: "ALERT_HISTORY",
            data: alertsQueue.slice(-10)
          }));
        }
      }
    });



    ws.send(JSON.stringify({
      type: "PRICE_UPDATE",
      data: stocks.map(stock => ({
        ...stock,
        alert: alertsConfig[stock.symbol] || null
      }))
    }));

  }, 2000);

  ws.on("close", () => clearInterval(interval));
});










function checkAlert(alert, prices) {

  // console.log("Checking alert with config:", alert);
  // if(alert) {
  //   // console.log("No alert configured.");
  //   // console.log(prices);
  // }

  if (!alert || prices.length === 0) return null;

  if (alert.strategy === "spike") {
    const latest = prices[prices.length - 1];

    const ticks = Math.max(2, Math.floor(alert.windowSec / 5));
    const index = Math.max(0, prices.length - ticks);

    const old = prices[index];

    const percent = ((latest - old) / old) * 100;
    // console.log(`Spike check: latest=${latest}, old=${old}, percent=${percent.toFixed(2)}%`);
    if (percent >= alert.thresholdPercent) {
      return { type: "SPIKE", percent: +percent.toFixed(2) };
    }

    if (percent <= -alert.thresholdPercent) {
      return { type: "DROP", percent: +percent.toFixed(2) };
    }
  }

  if (alert.strategy === "movingAverage") {
    if (prices.length < alert.sampleSize) return null;

    const last = prices.slice(-alert.sampleSize);
    const avg = last.reduce((a, b) => a + b, 0) / alert.sampleSize;

    const latest = prices[prices.length - 1];
    const deviation = ((latest - avg) / avg) * 100;

    if (deviation >= alert.deviationPercent) {
      return { type: "ABOVE_AVG", deviation: +deviation.toFixed(2) };
    }

    if (deviation <= -alert.deviationPercent) {
      return { type: "BELOW_AVG", deviation: +deviation.toFixed(2) };
    }
  }

  return null;
}


server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});