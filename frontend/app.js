const API_BASE = 'https://blackbitswan.onrender.com';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

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

  if (!element) return;

  try {

    const response =
      await fetch(`${API_BASE}/api/mood`);

    if (!response.ok) {
      throw new Error(`Mood HTTP ${response.status}`);
    }

    const data =
      await response.json();

    if (typeof data.mood_percent === 'number') {
      element.textContent =
        `${data.mood_percent}%`;
    } else {
      element.textContent = '--%';
    }

  } catch (error) {

    console.error('Mood error:', error);
    element.textContent = '--%';

  }
}


// ======================================================
// GET COINGECKO PRICES
// ======================================================

async function fetchPrices() {

  const ids =
    ASSETS.map(asset => asset.id).join(',');

  const url =
    `${COINGECKO_BASE}/simple/price` +
    `?ids=${encodeURIComponent(ids)}` +
    `&vs_currencies=usd`;

  console.log('CoinGecko URL:', url);

  const response =
    await fetch(url);

  console.log(
    'CoinGecko HTTP:',
    response.status
  );

  if (!response.ok) {
    throw new Error(
      `CoinGecko HTTP ${response.status}`
    );
  }

  const data =
    await response.json();

  console.log(
    'CoinGecko DATA:',
    data
  );

  return data;
}


// ======================================================
// RENDER
// ======================================================

function renderPrices(data) {

  const container =
    document.getElementById('crypto-prices');

  if (!container) {

    console.error(
      'ERROR: #crypto-prices does not exist'
    );

    return;
  }

  container.innerHTML = '';

  ASSETS.forEach(asset => {

    const price =
      data?.[asset.id]?.usd;

    const card =
      document.createElement('div');

    card.className =
      'crypto-card';

    if (
      typeof price === 'number' &&
      Number.isFinite(price)
    ) {

      card.innerHTML = `
        <h3>${asset.name}</h3>
        <p>$${Math.round(price).toLocaleString('en-US')}</p>
        <small>${asset.ticker}</small>
      `;

    } else {

      card.innerHTML = `
        <h3>${asset.name}</h3>
        <p>NO DATA</p>
        <small>${asset.ticker}</small>
      `;

    }

    container.appendChild(card);

  });
}


// ======================================================
// MARKET DATA
// ======================================================

async function fetchMarketData() {

  console.log(
    '========== MARKET START =========='
  );

  try {

    const data =
      await fetchPrices();

    renderPrices(data);

  } catch (error) {

    console.error(
      'MARKET ERROR:',
      error
    );

  }

  console.log(
    '========== MARKET END =========='
  );
}


// ======================================================
// START
// ======================================================

fetchMood();
fetchMarketData();

setInterval(
  fetchMood,
  5 * 60 * 1000
);

setInterval(
  fetchMarketData,
  5 * 60 * 1000
);
