// ================== API base URL ==================
const API_BASE = 'https://blackbitswan.onrender.com';

// ================== Market Mood ==================
const moodElement = document.getElementById('mood-value');

async function fetchMood() {
  try {
    const response = await fetch(`${API_BASE}/api/mood`);

    if (!response.ok) {
      throw new Error(`Mood API error: ${response.status}`);
    }

    const data = await response.json();

    if (data && typeof data.mood_percent === 'number') {
      moodElement.textContent = `${Math.round(data.mood_percent)}%`;
    } else {
      console.warn('⚠️ Mood value not found');
      moodElement.textContent = '--%';
    }
  } catch (error) {
    console.error('❌ Error fetching market mood:', error);
    moodElement.textContent = '--%';
  }
}


// ================== Market Prices ==================

// Free public sources:
//
// BTC:
// CoinGecko
//
// Stocks:
// QuantEngines public market-data API
//
// Brent:
// Croncopia public commodity API
//
// No API keys required.

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

const STOCKS = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA'
  },
  {
    symbol: 'MU',
    name: 'Micron'
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet'
  },
  {
    symbol: 'AMZN',
    name: 'Amazon'
  }
];

const STOCK_API_BASE =
  'https://quantengines.com/api/v1/market-data/public/quote';

const BRENT_URL =
  'https://croncopia.com/api/energy/brent_crude.json';


// ================== Fetch BTC ==================

async function fetchBitcoin() {
  const response = await fetch(COINGECKO_URL);

  if (!response.ok) {
    throw new Error(`Bitcoin API error: ${response.status}`);
  }

  const data = await response.json();

  if (
    !data ||
    !data.bitcoin ||
    typeof data.bitcoin.usd !== 'number'
  ) {
    throw new Error('Bitcoin price not found');
  }

  return data.bitcoin.usd;
}


// ================== Fetch Stock ==================

async function fetchStock(symbol) {
  const response = await fetch(
    `${STOCK_API_BASE}/${encodeURIComponent(symbol)}`
  );

  if (!response.ok) {
    throw new Error(
      `${symbol} API error: ${response.status}`
    );
  }

  const data = await response.json();

  if (!data || typeof data.price !== 'number') {
    throw new Error(
      `${symbol} price not found`
    );
  }

  return data.price;
}


// ================== Fetch Brent ==================

async function fetchBrent() {
  const response = await fetch(BRENT_URL);

  if (!response.ok) {
    throw new Error(
      `Brent API error: ${response.status}`
    );
  }

  const data = await response.json();

  if (!data || typeof data.price !== 'number') {
    throw new Error('Brent price not found');
  }

  return data.price;
}


// ================== Create Market Card ==================

function createMarketCard(name, symbol, adjustedValue) {
  const card = document.createElement('div');

  card.className = 'crypto-card';

  card.innerHTML = `
    <h3>${name}</h3>
    <p>$${Math.round(adjustedValue).toLocaleString('en-US')}</p>
    <p>${symbol}</p>
  `;

  return card;
}


// ================== Fetch All Market Values ==================

async function fetchPrices() {
  const container =
    document.getElementById('crypto-prices');

  if (!container) {
    console.error(
      '❌ Element #crypto-prices not found'
    );
    return;
  }

  try {
    // Fetch Brent first because K depends on Brent
    const brentPrice = await fetchBrent();

    if (!Number.isFinite(brentPrice) || brentPrice <= 0) {
      throw new Error(
        'Invalid Brent price'
      );
    }

    // ==============================
    // BlackBitSwan coefficient
    // K = 80 / Brent
    // ==============================

    const K = 80 / brentPrice;

    console.log(
      `🛢️ Brent: $${brentPrice}`
    );

    console.log(
      `📐 BlackBitSwan K: ${K}`
    );


    // ==============================
    // Fetch BTC + stocks in parallel
    // ==============================

    const results = await Promise.allSettled([
      fetchBitcoin(),

      ...STOCKS.map(stock =>
        fetchStock(stock.symbol)
      )
    ]);


    // ==============================
    // Clear previous cards
    // ==============================

    container.innerHTML = '';


    // ==============================
    // BTC
    // ==============================

    const btcResult = results[0];

    if (btcResult.status === 'fulfilled') {
      const btcPrice = btcResult.value;

      // BlackBitSwan adjusted value
      const adjustedBTC =
        btcPrice * K;

      container.appendChild(
        createMarketCard(
          'Bitcoin',
          'BTC',
          adjustedBTC
        )
      );

      console.log(
        `₿ BTC: ${btcPrice} → ${adjustedBTC}`
      );

    } else {
      console.error(
        '❌ BTC error:',
        btcResult.reason
      );

      container.appendChild(
        createMarketCard(
          'Bitcoin',
          'BTC',
          0
        )
      );
    }


    // ==============================
    // Stocks
    // ==============================

    STOCKS.forEach((stock, index) => {

      const result = results[index + 1];

      if (result.status === 'fulfilled') {

        const currentPrice =
          result.value;

        // BlackBitSwan adjusted value
        const adjustedValue =
          currentPrice * K;

        container.appendChild(
          createMarketCard(
            stock.name,
            stock.symbol,
            adjustedValue
          )
        );

        console.log(
          `📈 ${stock.symbol}: ${currentPrice} → ${adjustedValue}`
        );

      } else {

        console.error(
          `❌ ${stock.symbol} error:`,
          result.reason
        );

        const card =
          document.createElement('div');

        card.className = 'crypto-card';

        card.innerHTML = `
          <h3>${stock.name}</h3>
          <p>--</p>
          <p>${stock.symbol}</p>
        `;

        container.appendChild(card);
      }
    });


    // ==============================
    // Brent + K information
    // ==============================

    const info = document.createElement('div');

    info.className = 'market-info';

    info.innerHTML = `
      <p>
        Brent: $${Math.round(brentPrice).toLocaleString('en-US')}
      </p>
      <p>
        K: ${K.toFixed(4)}
      </p>
    `;

    container.appendChild(info);


  } catch (error) {

    console.error(
      '❌ Failed to fetch market prices:',
      error
    );

    container.innerHTML = `
      <div class="crypto-card">
        <h3>Market Data</h3>
        <p>Temporarily unavailable</p>
        <p>Please try again later</p>
      </div>
    `;
  }
}


// ================== Initialization ==================

fetchMood();
fetchPrices();


// ================== Auto Refresh ==================

// Market Mood: every 5 minutes
setInterval(
  fetchMood,
  5 * 60 * 1000
);

// Market prices: every 5 minutes
setInterval(
  fetchPrices,
  5 * 60 * 1000
);
