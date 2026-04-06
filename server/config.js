const SECTORS = {
  TECH:    { prefix: 'T',  baseMin: 50,   baseMax: 1500 },
  FINANCE: { prefix: 'F',  baseMin: 20,   baseMax: 500  },
  HEALTH:  { prefix: 'H',  baseMin: 30,   baseMax: 800  },
  ENERGY:  { prefix: 'E',  baseMin: 10,   baseMax: 300  },
  RETAIL:  { prefix: 'R',  baseMin: 15,   baseMax: 400  },
};

function generateSymbol(prefix, index) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const a = letters[Math.floor(index / 26) % 26];
  const b = letters[index % 26];
  return `${prefix}${a}${b}`;
}

function generateStocks(countPerSector = 200) {
  const stocks = [];

  for (const [sector, { prefix, baseMin, baseMax }] of Object.entries(SECTORS)) {
    for (let i = 0; i < countPerSector; i++) {
      const symbol = generateSymbol(prefix, i);
      const basePrice = +(Math.random() * (baseMax - baseMin) + baseMin).toFixed(2);

      stocks.push({
        symbol,
        sector,
        price: basePrice,
        change: 0,
        alert: null,
      });
    }
  }

  return stocks;
}

const stocks = generateStocks(200);

module.exports = stocks;