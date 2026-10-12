// BlackBitSwan eAI — live model indicators.
const API_BASE = 'https://blackbitswan.onrender.com';
const CG = 'https://api.coingecko.com/api/v3';
const BRENT_URL = 'https://croncopia.com/api/energy/brent_crude.json';
const assets = [
  { name: 'Bitcoin', ticker: 'BTC', id: 'bitcoin' },
  { name: 'NVIDIA', ticker: 'NVDAX', id: 'nvidia-xstock' },
  { name: 'Micron', ticker: 'MUX', id: 'micron-technology-xstock' },
  { name: 'Alphabet', ticker: 'GOOGLX', id: 'alphabet-xstock' },
  { name: 'Amazon', ticker: 'AMZNX', id: 'amazon-xstock' }
];

async function fetchMood() {
  const light = document.getElementById('mood-light');
  const status = document.getElementById('mood-status');
  if (!light || !status) return;
  try {
    const response = await fetch(API_BASE + '/api/mood', { cache: 'no-store' });
    if (!response.ok) throw new Error('Mood HTTP ' + response.status);
    const data = await response.json();
    const raw = Number(data.mood_percent);
    if (!Number.isFinite(raw)) throw new Error('Mood value unavailable');
    const mood = Math.max(0, Math.min(100, raw));
    light.classList.remove('mood-unknown', 'mood-low', 'mood-mid', 'mood-high');
    if (mood < 34) {
      light.classList.add('mood-low');
      status.textContent = 'Risk-off';
    } else if (mood < 67) {
      light.classList.add('mood-mid');
      status.textContent = 'Neutral';
    } else {
      light.classList.add('mood-high');
      status.textContent = 'Risk-on';
    }
    light.title = 'Backend mood score: ' + Math.round(mood) + '/100';
    status.title = light.title;
  } catch (error) {
    light.classList.remove('mood-low', 'mood-mid', 'mood-high');
    light.classList.add('mood-unknown');
    status.textContent = 'Unavailable';
    console.warn('Market mood is currently unavailable:', error);
  }
}

async function fetchBrent() {
  const response = await fetch(BRENT_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error('Brent HTTP ' + response.status);
  const data = await response.json();
  const price = Number(data.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid Brent price');
  return price;
}

async function fetchPrices() {
  const ids = assets.map(asset => asset.id).join(',');
  const response = await fetch(CG + '/simple/price?ids=' + encodeURIComponent(ids) + '&vs_currencies=usd', { cache: 'no-store' });
  if (!response.ok) throw new Error('CoinGecko HTTP ' + response.status);
  return response.json();
}

function renderIndicators(values, updatedAt) {
  const container = document.getElementById('crypto-prices');
  const updated = document.getElementById('market-updated');
  if (!container) return;
  container.replaceChildren();
  assets.forEach(asset => {
    const item = document.createElement('div');
    item.className = 'ticker-item';
    const ticker = document.createElement('span');
    ticker.textContent = asset.ticker;
    const value = document.createElement('strong');
    const numeric = values[asset.ticker];
    value.textContent = Number.isFinite(numeric)
      ? '$' + numeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : 'Unavailable';
    const name = document.createElement('small');
    name.textContent = asset.name + ' · model index';
    item.append(ticker, value, name);
    container.appendChild(item);
  });
  if (updated) updated.textContent = 'Updated ' + updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function fetchMarketData() {
  const values = Object.fromEntries(assets.map(asset => [asset.ticker, NaN]));
  const updatedAt = new Date();
  try {
    const [brent, prices] = await Promise.all([fetchBrent(), fetchPrices()]);
    // Restored original formula: BTC = spot × (80 / Brent);
    // stocks = spot × ((80 × random multiplier 1.02–1.10) / Brent).
    // Random multipliers intentionally preserve the original changing demo behaviour.
    const stockMultipliers = {
      NVDAX: 1.02 + Math.random() * 0.08,
      MUX: 1.02 + Math.random() * 0.08,
      GOOGLX: 1.02 + Math.random() * 0.08,
      AMZNX: 1.02 + Math.random() * 0.08
    };
    assets.forEach(asset => {
      const spot = Number(prices?.[asset.id]?.usd);
      if (!Number.isFinite(spot) || spot <= 0) return;
      const multiplier = asset.ticker === 'BTC' ? 1 : stockMultipliers[asset.ticker];
      values[asset.ticker] = spot * (80 * multiplier / brent);
    });
  } catch (error) {
    console.warn('Market model update failed:', error);
  }
  renderIndicators(values, updatedAt);
}

fetchMood();
fetchMarketData();
setInterval(fetchMood, 5 * 60 * 1000);
setInterval(fetchMarketData, 5 * 60 * 1000);
