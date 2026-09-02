// ======================================================
// BlackBitSwan
// Market Data
// CoinGecko
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
// Market Mood
// ======================================================

const moodElement = document.getElementById('mood-value');


async function fetchMood() {

  if (!moodElement) {
    console.warn('⚠️ #mood-value not found');
    return;
  }

  try {

    const response = await fetch(
      `${API_BASE}/api/mood`
    );

    if (!response.ok) {
      throw new Error(
        `Mood HTTP ${response.status}`
      );
    }

    const data = await response.json();

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
// Get CoinGecko prices
//
// One request for all five assets.
// ======================================================

async function fetchAssetPrices() {

  const ids = ASSETS
    .map(asset => asset.id)
    .join(',');

  const url =
    `${COINGECKO_BASE}/simple/price` +
    `?ids=${encodeURIComponent(ids)}` +
    `&vs_currencies=usd`;

  console.log('📡 CoinGecko request:', url);

  const response = await fetch(url);

  if (!response.ok) {

    throw new Error(
      `CoinGecko HTTP ${response.status}`
    );

  }

  const data = await response.json();

  console.log(
    '📊 CoinGecko asset prices:',
    data
  );

  return data;
}


// ======================================================
// Get Brent
//
// CoinGecko displays Brent as:
//
// Crude Oil Brent Futures
// Symbol: BRENTOIL
//
// It is NOT a normal CoinGecko coin ID,
// therefore it is handled separately.
// ======================================================

async function fetchBrentPrice() {

  /*
   * CoinGecko's public website exposes the current
   * Brent benchmark here:
   *
   * Crude Oil Brent Futures (BRENTOIL)
   *
   * The public /search endpoint must NOT be used
   * to resolve BRENTOIL as a coin.
   *
   * We first try CoinGecko's commodity data endpoint.
   */

  const urls = [

    'https://api.coingecko.com/api/v3/commodities',

    'https://api.coingecko.com/api/v3/commodities/crude-oil-brent-futures'

  ];

  for (const url of urls) {

    try {

      console.log(
        '🛢 Trying Brent:',
        url
      );

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(
          `Brent endpoint HTTP ${response.status}:`,
          url
        );
        continue;
      }

      const data = await response.json();

      console.log(
        '🛢 Brent response:',
        data
      );

      const price = extractBrentPrice(data);

      if (
        typeof price === 'number' &&
        Number.isFinite(price) &&
        price > 0
      ) {

        console.log(
          '🛢 Brent price:',
          price
        );

        return price;

      }

    } catch (error) {

      console.warn(
        '⚠️ Brent endpoint failed:',
        error
      );

    }

  }


  throw new Error(
    'Unable to retrieve BRENTOIL price from CoinGecko'
  );
}


// ======================================================
// Extract Brent price from possible CoinGecko formats
// ======================================================

function extractBrentPrice(data) {

  // Direct object

  if (
    data &&
    typeof data.price === 'number'
  ) {
    return data.price;
  }


  if (
    data &&
    typeof data.current_price === 'number'
  ) {
    return data.current_price;
  }


  if (
    data &&
    typeof data.usd === 'number'
  ) {
    return data.usd;
  }


  // BRENTOIL object

  if (
    data &&
    data.BRENTOIL &&
    typeof data.BRENTOIL.usd === 'number'
  ) {
    return data.BRENTOIL.usd;
  }


  // Array

  if (Array.isArray(data)) {

    const brent = data.find(item => {

      const symbol =
        String(
          item?.symbol || ''
        ).toUpperCase();

      const name =
        String(
          item?.name || ''
        ).toLowerCase();

      return (
        symbol === 'BRENTOIL' ||
        name.includes('crude oil brent') ||
        name.includes('brent')
      );

    });


    if (brent) {

      if (
        typeof brent.price === 'number'
      ) {
        return brent.price;
      }

      if (
        typeof brent.current_price === 'number'
      ) {
        return brent.current_price;
      }

      if (
        typeof brent.usd === 'number'
      ) {
        return brent.usd;
      }

    }

  }


  return null;
}


// ======================================================
// Create card
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


  const displayValue =
    typeof value === 'number' &&
    Number.isFinite(value)
      ? `$${Math.round(value).toLocaleString('en-US')}`
      : '--';


  card.innerHTML = `
    <h3>${name}</h3>
    <p>${displayValue}</p>
    <small>${ticker}</small>
  `;


  return card;
}


// ======================================================
// Render cards
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

    const value =
      values[asset.ticker];


    container.appendChild(
      createMarketCard(
        asset.name,
        asset.ticker,
        value
      )
    );

  });

}


// ======================================================
// Fetch Market Data
// ======================================================

async function fetchMarketData() {

  console.log(
    '📊 Starting BlackBitSwan market update...'
  );


  const values = {
    BTC: null,
    NVDAX: null,
    MUX: null,
    GOOGLX: null,
    AMZNX: null
  };


  // ----------------------------------------------------
  // Get Brent
  // ----------------------------------------------------

  let brentPrice = null;


  try {

    brentPrice =
      await fetchBrentPrice();

  } catch (error) {

    console.error(
      '❌ Brent error:',
      error
    );

  }


  // ----------------------------------------------------
  // Calculate K
  // ----------------------------------------------------

  let K = null;


  if (
    typeof brentPrice === 'number' &&
    brentPrice > 0
  ) {

    K =
      80 / brentPrice;


    console.log(
      'K:',
      K
    );

  }


  // ----------------------------------------------------
  // Get five assets
  // ----------------------------------------------------

  let prices = {};


  try {

    prices =
      await fetchAssetPrices();

  } catch (error) {

    console.error(
      '❌ CoinGecko asset error:',
      error
    );

  }


  // ----------------------------------------------------
  // Calculate adjusted values
  // ----------------------------------------------------

  ASSETS.forEach(asset => {

    const raw =
      prices?.[asset.id]?.usd;


    if (
      typeof raw === 'number' &&
      Number.isFinite(raw) &&
      raw > 0 &&
      typeof K === 'number'
    ) {

      values[asset.ticker] =
        raw * K;


      console.log(
        `${asset.ticker}:`,
        raw,
        '→',
        values[asset.ticker]
      );

    } else {

      console.warn(
        `⚠️ No adjusted value for ${asset.ticker}`
      );

    }

  });


  // ----------------------------------------------------
  // Render
  // ----------------------------------------------------

  renderMarketCards(values);


  console.log(
    '✅ BlackBitSwan market update completed'
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
