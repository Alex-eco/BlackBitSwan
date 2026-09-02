```javascript
// ======================================================
// BlackBitSwan
// Market Data — CoinGecko only
// Backend is NOT used for market prices
// ======================================================

const API_BASE = 'https://blackbitswan.onrender.com';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';


// ======================================================
// CoinGecko IDs
// ======================================================

const ASSETS = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    ticker: 'BTC'
  },
  {
    id: 'nvidia-xstock',
    name: 'NVIDIA',
    ticker: 'NVDAX'
  },
  {
    id: 'micron-technology-xstock',
    name: 'Micron',
    ticker: 'MUX'
  },
  {
    id: 'alphabet-xstock',
    name: 'Alphabet',
    ticker: 'GOOGLX'
  },
  {
    id: 'amazon-xstock',
    name: 'Amazon',
    ticker: 'AMZNX'
  }
];


// Brent on CoinGecko

const BRENT_ID = 'crude-oil-brent-futures';


// ======================================================
// Market Mood
// ======================================================

const moodElement = document.getElementById('mood-value');


async function fetchMood() {

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

      moodElement.textContent = '--%';

    }

  } catch (error) {

    console.error(
      '❌ Market Mood error:',
      error
    );

    moodElement.textContent = '--%';
  }
}


// ======================================================
// Fetch one CoinGecko price
// ======================================================

async function getCoinGeckoPrice(id) {

  const url =
    `${COINGECKO_BASE}/simple/price` +
    `?ids=${encodeURIComponent(id)}` +
    `&vs_currencies=usd`;


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      `CoinGecko ${id}: HTTP ${response.status}`
    );

  }


  const data =
    await response.json();


  const price =
    data?.[id]?.usd;


  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price <= 0
  ) {

    throw new Error(
      `CoinGecko ${id}: price unavailable`
    );

  }


  return price;
}


// ======================================================
// Create card
// ======================================================

function createCard(
  name,
  ticker,
  value
) {

  const card =
    document.createElement('div');

  card.className =
    'crypto-card';


  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {

    card.innerHTML = `
      <h3>${name}</h3>
      <p>$${Math.round(value).toLocaleString('en-US')}</p>
      <small>${ticker}</small>
    `;

  } else {

    card.innerHTML = `
      <h3>${name}</h3>
      <p>--</p>
      <small>${ticker}</small>
    `;

  }


  return card;
}


// ======================================================
// Market Data
// ======================================================

async function fetchMarketData() {

  const container =
    document.getElementById('crypto-prices');


  if (!container) {

    console.error(
      '❌ crypto-prices container not found'
    );

    return;
  }


  console.log(
    '📊 Loading CoinGecko market data...'
  );


  // ----------------------------------------------------
  // FIRST: get Brent independently
  // ----------------------------------------------------

  let brentPrice = null;

  try {

    brentPrice =
      await getCoinGeckoPrice(BRENT_ID);

    console.log(
      '🛢 Brent:',
      brentPrice
    );

  } catch (error) {

    console.error(
      '❌ Brent unavailable:',
      error
    );

  }


  // ----------------------------------------------------
  // Calculate K only when Brent exists
  // ----------------------------------------------------

  let K = null;

  if (
    typeof brentPrice === 'number' &&
    Number.isFinite(brentPrice) &&
    brentPrice > 0
  ) {

    K =
      80 / brentPrice;

  }


  // ----------------------------------------------------
  // Fetch all five assets independently
  // ----------------------------------------------------

  const results =
    await Promise.allSettled(

      ASSETS.map(
        asset =>
          getCoinGeckoPrice(asset.id)
      )

    );


  // ----------------------------------------------------
  // Clear existing cards
  // ----------------------------------------------------

  container.innerHTML = '';


  // ----------------------------------------------------
  // Build five cards
  // ----------------------------------------------------

  ASSETS.forEach(
    (asset, index) => {

      const result =
        results[index];


      let adjustedValue = null;


      // Asset price successfully received
      if (
        result.status === 'fulfilled' &&
        typeof K === 'number'
      ) {

        const currentPrice =
          result.value;


        adjustedValue =
          currentPrice * K;


        console.log(
          `${asset.ticker}:`,
          currentPrice,
          '→',
          Math.round(adjustedValue)
        );

      }


      // If asset failed
      if (
        result.status === 'rejected'
      ) {

        console.error(
          `❌ ${asset.ticker} unavailable:`,
          result.reason
        );

      }


      container.appendChild(
        createCard(
          asset.name,
          asset.ticker,
          adjustedValue
        )
      );

    }
  );


  // ----------------------------------------------------
  // Diagnostic information only in browser console
  // ----------------------------------------------------

  console.log(
    '✅ Market Data update completed'
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
