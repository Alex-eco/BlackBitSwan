```javascript
// ======================================================
// BlackBitSwan
// Market Data
// CoinGecko only
// ======================================================

const API_BASE = 'https://blackbitswan.onrender.com';

const COINGECKO_BASE =
  'https://api.coingecko.com/api/v3';


// ======================================================
// Assets
// ======================================================

const ASSETS = [
  {
    name: 'Bitcoin',
    ticker: 'BTC',
    type: 'bitcoin'
  },
  {
    name: 'NVIDIA',
    ticker: 'NVDAX',
    type: 'tokenized'
  },
  {
    name: 'Micron',
    ticker: 'MUX',
    type: 'tokenized'
  },
  {
    name: 'Alphabet',
    ticker: 'GOOGLX',
    type: 'tokenized'
  },
  {
    name: 'Amazon',
    ticker: 'AMZNX',
    type: 'tokenized'
  }
];


// ======================================================
// Brent search term
// ======================================================

const BRENT_SEARCH =
  'BRENTOIL';


// ======================================================
// Cache
// ======================================================

const resolvedIds = {};


// ======================================================
// Market Mood
// ======================================================

const moodElement =
  document.getElementById('mood-value');


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

      moodElement.textContent =
        '--%';

    }

  } catch (error) {

    console.error(
      '❌ Mood error:',
      error
    );

    moodElement.textContent =
      '--%';
  }
}


// ======================================================
// CoinGecko search
// ======================================================

async function searchCoinGecko(query) {

  const url =
    `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`;


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      `CoinGecko search HTTP ${response.status}`
    );

  }


  const data =
    await response.json();


  return data?.coins || [];
}


// ======================================================
// Find exact tokenized stock ID
// ======================================================

async function findTokenizedStockId(ticker) {

  // Already resolved
  if (resolvedIds[ticker]) {
    return resolvedIds[ticker];
  }


  const coins =
    await searchCoinGecko(ticker);


  // Prefer exact symbol match
  let match =
    coins.find(
      coin =>
        String(coin.symbol).toUpperCase() ===
        ticker.toUpperCase()
    );


  // Prefer xStock name
  if (!match) {

    match =
      coins.find(
        coin =>
          String(coin.name)
            .toLowerCase()
            .includes('xstock')
      );

  }


  if (!match) {

    throw new Error(
      `Tokenized stock not found: ${ticker}`
    );

  }


  resolvedIds[ticker] =
    match.id;


  console.log(
    `✅ ${ticker} → ${match.id} → ${match.name}`
  );


  return match.id;
}


// ======================================================
// Get price using CoinGecko /simple/price
// ======================================================

async function getPrice(id) {

  const url =
    `${COINGECKO_BASE}/simple/price` +
    `?ids=${encodeURIComponent(id)}` +
    `&vs_currencies=usd`;


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      `Price HTTP ${response.status} for ${id}`
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
      `No USD price for ${id}`
    );

  }


  return price;
}


// ======================================================
// Get Bitcoin price
//
// IMPORTANT:
// This uses the SAME endpoint that was proven
// to work in your original version.
// ======================================================

async function getBitcoinPrice() {

  const url =
    `${COINGECKO_BASE}/coins/markets` +
    `?vs_currency=usd` +
    `&ids=bitcoin`;


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      `Bitcoin HTTP ${response.status}`
    );

  }


  const data =
    await response.json();


  const price =
    data?.[0]?.current_price;


  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price <= 0
  ) {

    throw new Error(
      'Bitcoin price unavailable'
    );

  }


  console.log(
    '₿ Bitcoin:',
    price
  );


  return price;
}


// ======================================================
// Find Brent ID
// ======================================================

async function findBrentId() {

  const coins =
    await searchCoinGecko(BRENT_SEARCH);


  console.log(
    '🔎 Brent search:',
    coins
  );


  // Exact symbol BRENTOIL
  let match =
    coins.find(
      coin =>
        String(coin.symbol).toUpperCase() ===
        'BRENTOIL'
    );


  // Otherwise look for Brent
  if (!match) {

    match =
      coins.find(
        coin =>
          String(coin.name)
            .toLowerCase()
            .includes('brent')
      );

  }


  if (!match) {

    throw new Error(
      'Brent not found on CoinGecko'
    );

  }


  console.log(
    `🛢 Brent → ${match.id} → ${match.name}`
  );


  return match.id;
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


  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {

    card.innerHTML = `
      <h3>${name}</h3>
      <p>
        $${Math.round(value).toLocaleString('en-US')}
      </p>
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
// Fetch Market Data
// ======================================================

async function fetchMarketData() {

  const container =
    document.getElementById('crypto-prices');


  if (!container) {

    console.error(
      '❌ #crypto-prices not found'
    );

    return;
  }


  console.log(
    '📊 Starting CoinGecko market update...'
  );


  // ----------------------------------------------------
  // 1. Get Brent independently
  // ----------------------------------------------------

  let brentPrice = null;


  try {

    const brentId =
      await findBrentId();


    brentPrice =
      await getPrice(brentId);


    console.log(
      '🛢 Brent price:',
      brentPrice
    );

  } catch (error) {

    console.error(
      '❌ Brent error:',
      error
    );

  }


  // ----------------------------------------------------
  // 2. Calculate K
  // ----------------------------------------------------

  let K = null;


  if (
    typeof brentPrice === 'number' &&
    brentPrice > 0
  ) {

    K =
      80 / brentPrice;


    console.log(
      'K calculated:',
      K
    );

  }


  // ----------------------------------------------------
  // 3. Fetch five assets independently
  // ----------------------------------------------------

  const pricePromises =
    ASSETS.map(async asset => {

      try {

        let price;


        // Bitcoin
        if (asset.type === 'bitcoin') {

          price =
            await getBitcoinPrice();

        }


        // Tokenized stock
        else {

          const id =
            await findTokenizedStockId(
              asset.ticker
            );


          price =
            await getPrice(id);

        }


        return {
          asset,
          price,
          success: true
        };


      } catch (error) {

        console.error(
          `❌ ${asset.ticker}:`,
          error
        );


        return {
          asset,
          price: null,
          success: false
        };

      }

    });


  const results =
    await Promise.all(pricePromises);


  // ----------------------------------------------------
  // 4. Render
  // ----------------------------------------------------

  container.innerHTML = '';


  results.forEach(result => {

    let adjustedValue = null;


    if (
      result.success &&
      typeof result.price === 'number' &&
      typeof K === 'number'
    ) {

      adjustedValue =
        result.price * K;

    }


    container.appendChild(
      createMarketCard(
        result.asset.name,
        result.asset.ticker,
        adjustedValue
      )
    );

  });


  console.log(
    '✅ Market update completed'
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
