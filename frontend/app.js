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
      moodElement.textContent = '--%';
    }

  } catch (error) {
    console.error('❌ Error fetching market mood:', error);
    moodElement.textContent = '--%';
  }
}


// ================== Market Assets ==================
//
// BTC     → CoinGecko
// Stocks  → Yahoo Finance
// Brent   → Yahoo Finance BZ=F
//
// BlackBitSwan calculation:
//
// K = 80 / Brent
//
// BlackBitSwan Value = Current Price × K
//
// Brent and K are NOT displayed.
// All final values are rounded to integers.
//


// ================== Asset configuration ==================

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


// ================== Yahoo Finance ==================

async function fetchYahooPrice(symbol) {

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `${symbol}: Yahoo Finance error ${response.status}`
    );
  }

  const data = await response.json();

  const meta =
    data?.chart?.result?.[0]?.meta;

  if (!meta) {
    throw new Error(
      `${symbol}: Yahoo Finance returned no data`
    );
  }

  // regularMarketPrice is preferable because
  // it remains available when the market is closed.

  const price =
    typeof meta.regularMarketPrice === 'number'
      ? meta.regularMarketPrice
      : meta.previousClose;

  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    throw new Error(
      `${symbol}: invalid price`
    );
  }

  return price;
}


// ================== Bitcoin ==================

async function fetchBitcoinPrice() {

  const url =
    'https://api.coingecko.com/api/v3/simple/price' +
    '?ids=bitcoin&vs_currencies=usd';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Bitcoin API error: ${response.status}`
    );
  }

  const data = await response.json();

  const price =
    data?.bitcoin?.usd;

  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    throw new Error(
      'Bitcoin price not found'
    );
  }

  return price;
}


// ================== Brent ==================

async function fetchBrentPrice() {

  // BZ=F = Brent Crude Oil futures
  const price =
    await fetchYahooPrice('BZ=F');

  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    throw new Error(
      'Invalid Brent price'
    );
  }

  return price;
}


// ================== Formatting ==================

function formatInteger(value) {

  return Math.round(value).toLocaleString(
    'en-US'
  );
}


// ================== Create Card ==================

function createMarketCard(
  name,
  symbol,
  value
) {

  const card =
    document.createElement('div');

  card.className =
    'crypto-card';

  card.innerHTML = `
    <h3>${name}</h3>

    <p>
      $${formatInteger(value)}
    </p>

    <p>
      ${symbol}
    </p>
  `;

  return card;
}


// ================== Fetch Market Values ==================

async function fetchPrices() {

  const container =
    document.getElementById(
      'crypto-prices'
    );

  if (!container) {
    console.error(
      '❌ #crypto-prices element not found'
    );
    return;
  }

  try {

    // ------------------------------------------
    // 1. Get current Brent
    // ------------------------------------------

    const brent =
      await fetchBrentPrice();


    // ------------------------------------------
    // 2. Calculate BlackBitSwan coefficient
    // ------------------------------------------

    const K =
      80 / brent;


    console.log(
      `Brent: ${brent}`
    );

    console.log(
      `BlackBitSwan K: ${K}`
    );


    // ------------------------------------------
    // 3. Get BTC + stocks simultaneously
    // ------------------------------------------

    const results =
      await Promise.allSettled([

        fetchBitcoinPrice(),

        ...STOCKS.map(
          stock =>
            fetchYahooPrice(stock.symbol)
        )

      ]);


    // ------------------------------------------
    // 4. Clear old values
    // ------------------------------------------

    container.innerHTML = '';


    // ------------------------------------------
    // 5. Bitcoin
    // ------------------------------------------

    const btcResult =
      results[0];

    if (
      btcResult.status === 'fulfilled'
    ) {

      const btcPrice =
        btcResult.value;

      const btcValue =
        btcPrice * K;

      container.appendChild(
        createMarketCard(
          'Bitcoin',
          'BTC',
          btcValue
        )
      );

      console.log(
        `BTC ${btcPrice} → ${btcValue}`
      );

    } else {

      console.error(
        '❌ BTC:',
        btcResult.reason
      );

      const card =
        document.createElement('div');

      card.className =
        'crypto-card';

      card.innerHTML = `
        <h3>Bitcoin</h3>
        <p>--</p>
        <p>BTC</p>
      `;

      container.appendChild(card);
    }


    // ------------------------------------------
    // 6. Stocks
    // ------------------------------------------

    STOCKS.forEach(
      (stock, index) => {

        const result =
          results[index + 1];

        const card =
          document.createElement('div');

        card.className =
          'crypto-card';


        if (
          result.status === 'fulfilled'
        ) {

          const currentPrice =
            result.value;

          const adjustedValue =
            currentPrice * K;

          card.innerHTML = `
            <h3>${stock.name}</h3>

            <p>
              $${formatInteger(adjustedValue)}
            </p>

            <p>
              ${stock.symbol}
            </p>
          `;

          console.log(
            `${stock.symbol} ${currentPrice} → ${adjustedValue}`
          );

        } else {

          console.error(
            `❌ ${stock.symbol}:`,
            result.reason
          );

          card.innerHTML = `
            <h3>${stock.name}</h3>
            <p>--</p>
            <p>${stock.symbol}</p>
          `;
        }


        container.appendChild(card);
      }
    );


  } catch (error) {

    console.error(
      '❌ Market data error:',
      error
    );

    container.innerHTML = `
      <div class="crypto-card">
        <h3>Market Data</h3>
        <p>Temporarily unavailable</p>
      </div>
    `;
  }
}


// ================== Initialization ==================

fetchMood();
fetchPrices();


// ================== Auto Refresh ==================

// Market Mood — every 5 minutes
setInterval(
  fetchMood,
  5 * 60 * 1000
);

// Market Values — every 5 minutes
setInterval(
  fetchPrices,
  5 * 60 * 1000
);
