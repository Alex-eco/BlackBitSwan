const API_BASE = 'https://blackbitswan.onrender.com';
const CG = 'https://api.coingecko.com/api/v3';
const BRENT_URL = 'https://croncopia.com/api/energy/brent_crude.json';

const assets = [
  ['Bitcoin', 'BTC', 'bitcoin'],
  ['NVIDIA', 'NVDAX', 'nvidia-xstock'],
  ['Micron', 'MUX', 'micron-technology-xstock'],
  ['Alphabet', 'GOOGLX', 'alphabet-xstock'],
  ['Amazon', 'AMZNX', 'amazon-xstock']
];

async function fetchMood() {
  const element = document.getElementById('mood-value');

  if (!element) {
    return;
  }

  try {
    const response = await fetch(API_BASE + '/api/mood');

    if (!response.ok) {
      throw new Error('Mood HTTP ' + response.status);
    }

    const data = await response.json();

    if (typeof data.mood_percent === 'number') {
      element.textContent = data.mood_percent + '%';
    } else {
      element.textContent = '--%';
    }
  } catch (error) {
    console.error('Mood error:', error);
    element.textContent = '--%';
  }
}

async function fetchBrent() {
  const response = await fetch(BRENT_URL);

  if (!response.ok) {
    throw new Error('Brent HTTP ' + response.status);
  }

  const data = await response.json();
  const price = Number(data.price);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid Brent price');
  }

  console.log('Brent:', price);

  return price;
}

async function fetchPrices() {
  const ids = assets.map(function(asset) {
    return asset[2];
  }).join(',');

  const url =
    CG +
    '/simple/price?ids=' +
    encodeURIComponent(ids) +
    '&vs_currencies=usd';

  console.log('CoinGecko:', url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('CoinGecko HTTP ' + response.status);
  }

  const data = await response.json();

  console.log('CoinGecko data:', data);

  return data;
}

function render(values) {
  const container = document.getElementById('crypto-prices');

  if (!container) {
    console.error('ERROR: #crypto-prices not found');
    return;
  }

  container.innerHTML = '';

  assets.forEach(function(asset) {
    const name = asset[0];
    const ticker = asset[1];
    const value = values[ticker];

    const card = document.createElement('div');
    card.className = 'crypto-card';

    let display = '--';

    if (typeof value === 'number' && Number.isFinite(value)) {
      display =
        '$' +
        Math.round(value).toLocaleString('en-US');
    }

    card.innerHTML =
      '<h3>' + name + '</h3>' +
      '<p>' + display + '</p>' +
      '<small>' + ticker + '</small>';

    container.appendChild(card);
  });
}

async function fetchMarketData() {
  console.log('===== MARKET UPDATE =====');

  const values = {
    BTC: null,
    NVDAX: null,
    MUX: null,
    GOOGLX: null,
    AMZNX: null
  };

  try {
    const brent = await fetchBrent();

    const k = 80 / brent;

    console.log('K:', k);

    const prices = await fetchPrices();

    assets.forEach(function(asset) {
      const ticker = asset[1];
      const id = asset[2];

      if (
        prices &&
        prices[id] &&
        typeof prices[id].usd === 'number'
      ) {
        values[ticker] =
          prices[id].usd * k;

        console.log(
          ticker +
          ': ' +
          prices[id].usd +
          ' -> ' +
          values[ticker]
        );
      } else {
        console.warn(
          'Missing price: ' + ticker
        );
      }
    });

  } catch (error) {
    console.error('Market error:', error);
  }

  render(values);
}

fetchMood();
fetchMarketData();

setInterval(fetchMood, 5 * 60 * 1000);
setInterval(fetchMarketData, 5 * 60 * 1000);
