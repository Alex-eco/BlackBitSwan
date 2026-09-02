```javascript
// ======================================================
// BlackBitSwan
// Market Data
//
// Assets: CoinGecko
// Brent: Croncopia
//
// Formula:
// K = 80 / Brent
// Adjusted Price = Asset Price * K
// ======================================================

const API_BASE = 'https://blackbitswan.onrender.com';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';


// ======================================================
// Assets
// ======================================================

const ASSETS = [
  {
    name: 'Bitcoin',
    ticker: 'BTC',
    id: 'bitcoin'
  },
  {
    name: 'NVIDIA',
    ticker: 'NVDAX',
    id: 'nvidia-xstock'
  },
  {
    name: 'Micron',
    ticker: 'MUX',
    id: 'micron-technology-xstock'
  },
  {
    name: 'Alphabet',
    ticker: 'GOOGLX',
    id: 'alphabet-xstock'
  },
  {
    name: 'Amazon',
    ticker: 'AMZNX',
    id: 'amazon-xstock'
  }
];


// ======================================================
// Brent
// ======================================================

const BRENT_URL =
  'https://croncopia.com/api/energy/brent_crude.json';

const BRENT_CACHE_KEY =
  'blackbitswan_brent_price';


// ======================================================
// Market Mood
// ======================================================

async function fetchMood() {

  const moodElement =
    document.getElementById('mood-value');

  if (!moodElement) {
    console.warn('⚠️ #mood-value not found');
    return;
  }

  try {

    const response =
      await fetch(`${API_BASE}/api/mood`);

    if (!response.ok) {
      throw new Error(
        `Mood HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      data &&
      typeof data.mood_percent === 'number'
    ) {

      moodElement.textContent =
        `${data.mood_percent}%`;

    } else {

      moodElement.textContent =
        '--%';

    }

  } catch (error) {

    console.error(
      '❌ Market Mood error:',
      error
    );

    moodElement.textContent =
      '--%';
  }
}


// ======================================================
// Get Brent price
// ======================================================

async function fetchBrentPrice() {

  try {

    console.log(
      '🛢 Requesting Brent price...'
    );

    const response =
      await fetch(BRENT_URL);

    if (!response.ok) {

      throw new Error(
        `Brent HTTP ${response.status}`
      );

    }

    const data =
      await response.json();

    const price =
      Number(data?.price);


    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {

      throw new Error(
        'Invalid Brent price'
      );

    }


    // Save last successful Brent price
    localStorage.setItem(
      BRENT_CACHE_KEY,
      String(price)
    );


    console.log(
      '🛢 Brent:',
      price
    );


    return price;

  } catch (error) {

    console.error(
      '❌ Brent request failed:',
      error
    );


    // --------------------------------------------------
    // Fallback to last successful price
    // --------------------------------------------------

    const cached =
      Number(
        localStorage.getItem(
          BRENT_CACHE_KEY
        )
      );


    if (
      Number.isFinite(cached) &&
      cached > 0
    ) {

      console.warn(
        '⚠️ Using cached Brent:',
        cached
      );

      return cached;

    }


    throw error;
  }
}


// ======================================================
// Get CoinGecko prices
// ======================================================

async function fetchAssetPrices() {

  const ids =
    ASSETS
      .map(asset => asset.id)
      .join(',');


  const url =
    `${COINGECKO_BASE}/simple/price` +
    `?ids=${encodeURIComponent(ids)}` +
    `&vs_currencies=usd`;


  console.log(
    '📡 CoinGecko request:',
    url
  );


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      `CoinGecko HTTP ${response.status}`
    );

  }


  const data =
    await response.json();


  console.log(
    '📊 CoinGecko prices:',
    data
  );


  return data;
}


// ======================================================
// Create market card
// ======================================================

function createMarketCard(
  name,
  ticker,
  value
) {

  const card =
    document.createElement('div');

  card.className =
    'crypto-card';


  let displayValue = '--';


  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {

    displayValue =
      `$${Math.round(value).toLocaleString('en-US')}`;

  }


  card.innerHTML = `
    <h3>${name}</h3>
    <p>${displayValue}</p>
    <small>${ticker}</small>
  `;


  return card;
}


// ======================================================
// Render market cards
// ======================================================

function renderMarketCards(values) {

  const container =
    document.getElementById('crypto-prices');


  if (!container) {

    console.error(
      '❌ #crypto-prices not found'
    );

    return;
  }


  container.innerHTML = '';


  ASSETS.forEach(asset => {

    container.appendChild(
      createMarketCard(
        asset.name,
        asset.ticker,
        values[asset.ticker]
      )
    );

  });

}


// ======================================================
// Fetch Market Data
// ======================================================

async function fetchMarketData() {

  console.log(
    '========== MARKET UPDATE =========='
  );


  const values = {
    BTC: null,
    NVDAX: null,
    MUX: null,
    GOOGLX: null,
    AMZNX: null
  };


  // ----------------------------------------------------
  // 1. Get Brent
  // ----------------------------------------------------

  let brentPrice;


  try {

    brentPrice =
      await fetchBrentPrice();

  } catch (error) {

    console.error(
      '❌ Cannot calculate market values:',
      error
    );


    renderMarketCards(values);

    return;
  }


  // ----------------------------------------------------
  // 2. Calculate K
  // ----------------------------------------------------

  const K =
    80 / brentPrice;


  console.log(
    'K calculated:',
    K
  );


  // ----------------------------------------------------
  // 3. Get CoinGecko prices
  // ----------------------------------------------------

  let prices;


  try {

    prices =
      await fetchAssetPrices();

  } catch (error) {

    console.error(
      '❌ CoinGecko error:',
      error
    );


    renderMarketCards(values);

    return;
  }


  // ----------------------------------------------------
  // 4. Calculate adjusted values
  // ----------------------------------------------------

  ASSETS.forEach(asset => {

    const rawPrice =
      Number(
        prices?.[asset.id]?.usd
      );


    if (
      Number.isFinite(rawPrice) &&
      rawPrice > 0
    ) {

      const adjustedValue =
        rawPrice * K;


      values[asset.ticker] =
        adjustedValue;


      console.log(
        `${asset.ticker}:`,
        rawPrice,
        '→',
        adjustedValue
      );

    } else {

      console.warn(
        `⚠️ No price for ${asset.ticker}`
      );

    }

  });


  // ----------------------------------------------------
  // 5. Render
  // ----------------------------------------------------

  renderMarketCards(values);


  console.log(
    '========== MARKET UPDATE DONE =========='
  );
}


// ======================================================
// Initial load
// ======================================================

fetchMood();
fetchMarketData();


// ======================================================
// Refresh every 5 minutes
// ======================================================

setInterval(
  fetchMood,
  5 * 60 * 1000
);

setInterval(
  fetchMarketData,
  5 * 60 * 1000
);
```
