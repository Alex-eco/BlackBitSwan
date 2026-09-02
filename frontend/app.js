```javascript
const API_BASE = 'https://blackbitswan.onrender.com';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const BRENT_URL = 'https://croncopia.com/api/energy/brent_crude.json';

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
// MARKET MOOD
// ======================================================

async function fetchMood() {

  const element = document.getElementById('mood-value');

  if (!element) {
    return;
  }

  try {

    const response = await fetch(
      API_BASE + '/api/mood'
    );

    if (!response.ok) {
      throw new Error(
        'Mood HTTP ' + response.status
      );
    }

    const data = await response.json();

    if (typeof data.mood_percent === 'number') {

      element.textContent =
        data.mood_percent + '%';

    } else {

      element.textContent = '--%';

    }

  } catch (error) {

    console.error('Mood error:', error);

    element.textContent = '--%';

  }
}


// ======================================================
// BRENT
// ======================================================

async function fetchBrent() {

  const response =
    await fetch(BRENT_URL);

  if (!response.ok) {

    throw new Error(
      'Brent HTTP ' + response.status
    );

  }

  const data =
    await response.json();

  const price =
    Number(data.price);

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {

    throw new Error(
      'Invalid Brent price'
    );

  }

  console.log(
    'Brent price:',
    price
  );

  return price;
}


// ======================================================
// COINGECKO
// ======================================================

async function fetchPrices() {

  const ids =
    ASSETS
      .map(function(asset) {
        return asset.id;
      })
      .join(',');


  const url =
    COINGECKO_BASE +
    '/simple/price?ids=' +
    encodeURIComponent(ids) +
    '&vs_currencies=usd';


  console.log(
    'CoinGecko URL:',
    url
  );


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      'CoinGecko HTTP ' + response.status
    );

  }


  const data =
    await response.json();


  console.log(
    'CoinGecko data:',
    data
  );


  return data;
}


// ======================================================
// CREATE CARD
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


  let displayValue = '--';


  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {

    displayValue =
      '$' +
      Math.round(value).toLocaleString('en-US');

  }


  card.innerHTML =
    '<h3>' +
    name +
    '</h3>' +

    '<p>' +
    displayValue +
    '</p>' +

    '<small>' +
    ticker +
    '</small>';


  return card;
}


// ======================================================
// RENDER
// ======================================================

function renderMarket(values) {

  const container =
    document.getElementById('crypto-prices');


  if (!container) {

    console.error(
      '#crypto-prices not found'
    );

    return;
  }


  container.innerHTML = '';


  ASSETS.forEach(function(asset) {

    const card =
      createCard(
        asset.name,
        asset.ticker,
        values[asset.ticker]
      );


    container.appendChild(card);

  });

}


// ======================================================
// MARKET DATA
// ======================================================

async function fetchMarketData() {

  console.log(
    '===== MARKET UPDATE START ====='
  );


  const values = {
    BTC: null,
    NVDAX: null,
    MUX: null,
    GOOGLX: null,
    AMZNX: null
  };


  // ----------------------------------------------------
  // Brent
  // ----------------------------------------------------

  let brent;

  try {

    brent =
      await fetchBrent();

  } catch (error) {

    console.error(
      'Brent error:',
      error
    );

    renderMarket(values);

    return;
  }


  // ----------------------------------------------------
  // K
  // ----------------------------------------------------

  const K =
    80 / brent;


  console.log(
    'K:',
    K
  );


  // ----------------------------------------------------
  // CoinGecko
  // ----------------------------------------------------

  let prices;

  try {

    prices =
      await fetchPrices();

  } catch (error) {

    console.error(
      'CoinGecko error:',
      error
    );

    renderMarket(values);

    return;
  }


  // ----------------------------------------------------
  // Adjusted values
  // ----------------------------------------------------

  ASSETS.forEach(function(asset) {

    const rawPrice =
      Number(
        prices &&
        prices[asset.id] &&
        prices[asset.id].usd
      );


    if (
      Number.isFinite(rawPrice) &&
      rawPrice > 0
    ) {

      values[asset.ticker] =
        rawPrice * K;


      console.log(
        asset.ticker +
        ': ' +
        rawPrice +
        ' -> ' +
        values[asset.ticker]
      );

    }

  });


  // ----------------------------------------------------
  // Display
  // ----------------------------------------------------

  renderMarket(values);


  console.log(
    '===== MARKET UPDATE DONE ====='
  );
}


// ======================================================
// START
// ======================================================

fetchMood();
fetchMarketData();


// ======================================================
// REFRESH
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

```
