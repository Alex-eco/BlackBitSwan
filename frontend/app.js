```javascript
const API_BASE = 'https://blackbitswan.onrender.com';
const CG = 'https://api.coingecko.com/api/v3';
const BRENT = 'https://croncopia.com/api/energy/brent_crude.json';

const assets = [
  ['Bitcoin', 'BTC', 'bitcoin'],
  ['NVIDIA', 'NVDAX', 'nvidia-xstock'],
  ['Micron', 'MUX', 'micron-technology-xstock'],
  ['Alphabet', 'GOOGLX', 'alphabet-xstock'],
  ['Amazon', 'AMZNX', 'amazon-xstock']
];

async function fetchMood() {
  const el = document.getElementById('mood-value');
  if (!el) return;

  try {
    const r = await fetch(API_BASE + '/api/mood');
    const d = await r.json();

    el.textContent =
      typeof d.mood_percent === 'number'
        ? d.mood_percent + '%'
        : '--%';

  } catch (e) {
    console.error('Mood:', e);
    el.textContent = '--%';
  }
}

async function fetchBrent() {
  const r = await fetch(BRENT);

  if (!r.ok) {
    throw new Error('Brent HTTP ' + r.status);
  }

  const d = await r.json();
  const price = Number(d.price);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid Brent price');
  }

  console.log('Brent:', price);

  return price;
}

async function fetchPrices() {
  const ids = assets
    .map(function (a) {
      return a[2];
    })
    .join(',');

  const url =
    CG +
    '/simple/price?ids=' +
    encodeURIComponent(ids) +
    '&vs_currencies=usd';

  const r = await fetch(url);

  if (!r.ok) {
    throw new Error('CoinGecko HTTP ' + r.status);
  }

  return await r.json();
}

function render(values) {
  const container =
    document.getElementById('crypto-prices');

  if (!container) {
    console.error('#crypto-prices not found');
    return;
  }

  container.innerHTML = '';

  assets.forEach(function (asset) {
    const name = asset[0];
    const ticker = asset[1];
    const value = values[ticker];

    const card = document.createElement('div');
    card.className = 'crypto-card';

    let text = '--';

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      text =
        '$' +
        Math.round(value).toLocaleString('en-US');
    }

    card.innerHTML =
      '<h3>' + name + '</h3>' +
      '<p>' + text + '</p>' +
      '<small>' + ticker + '</small>';

    container.appendChild(card);
  });
}

async function fetchMarketData() {
  console.log('MARKET UPDATE');

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

    assets.forEach(function (asset) {
      const name = asset[0];
      const ticker = asset[1];
      const id = asset[2];

      const price =
        prices &&
        prices[id] &&
        Number(prices[id].usd);

      if (
        Number.isFinite(price) &&
        price > 0
      ) {
        values[ticker] = price * k;

        console.log(
          name,
          price,
          '=>',
          values[ticker]
        );
      } else {
        console.warn(
          'No price:',
          ticker
        );
      }
    });

  } catch (e) {
    console.error('Market:', e);
  }

  render(values);
}

fetchMood();
fetchMarketData();

setInterval(fetchMood, 5 * 60 * 1000);
setInterval(fetchMarketData, 5 * 60 * 1000);
```
