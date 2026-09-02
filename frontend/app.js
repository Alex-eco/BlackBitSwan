// ================== API base URL ==================
const API_BASE = 'https://blackbitswan.onrender.com';

// ================== CoinGecko ==================
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Tokenized stocks + Bitcoin
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

// Brent price from CoinGecko
const BRENT_ID = 'crude-oil-brent-futures';

// ================== Fetch market mood ==================
const moodElement = document.getElementById('mood-value');

async function fetchMood() {
  try {
    const response = await fetch(`${API_BASE}/api/mood`);

    if (!response.ok) {
      throw new Error(`Mood request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data && typeof data.mood_percent === 'number') {
      moodElement.textContent = `${data.mood_percent}%`;
    } else {
      console.warn('⚠️ Mood value not found');
      moodElement.textContent = '--%';
    }
  } catch (error) {
    console.error('❌ Error fetching market mood:', error);
    moodElement.textContent = '--%';
  }
}

// ================== Fetch CoinGecko prices ==================
async function fetchMarketData() {
  const container = document.getElementById('crypto-prices');

  if (!container) {
    console.error('❌ #crypto-prices element not found');
    return;
  }

  try {
    // --------------------------------------------------
    // One CoinGecko request for all 6 required assets
    // --------------------------------------------------
    const ids = [
      ...ASSETS.map(asset => asset.id),
      BRENT_ID
    ].join(',');

    const url =
      `${COINGECKO_BASE}/simple/price` +
      `?ids=${encodeURIComponent(ids)}` +
      `&vs_currencies=usd`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko request failed: ${response.status}`);
    }

    const data = await response.json();

    // --------------------------------------------------
    // Brent
    // K = 80 / current Brent price
    // --------------------------------------------------
    const brentPrice = data?.[BRENT_ID]?.usd;

    if (
      typeof brentPrice !== 'number' ||
      !Number.isFinite(brentPrice) ||
      brentPrice <= 0
    ) {
      throw new Error('Brent price unavailable from CoinGecko');
    }

    const K = 80 / brentPrice;

    console.log('CoinGecko Brent price:', brentPrice);
    console.log('Calculated K:', K);

    // --------------------------------------------------
    // Clear old cards
    // --------------------------------------------------
    container.innerHTML = '';

    // --------------------------------------------------
    // Create exactly 5 cards
    // --------------------------------------------------
    ASSETS.forEach(asset => {
      const currentPrice = data?.[asset.id]?.usd;

      const card = document.createElement('div');
      card.className = 'crypto-card';

      if (
        typeof currentPrice === 'number' &&
        Number.isFinite(currentPrice)
      ) {
        // Required calculation:
        // adjustedValue = currentAssetPrice * K
        const adjustedValue = Math.round(currentPrice * K);

        card.innerHTML = `
          <h3>${asset.name}</h3>
          <p>$${adjustedValue.toLocaleString('en-US')}</p>
          <small>${asset.ticker}</small>
        `;
      } else {
        // One missing asset must NOT break the other cards
        card.innerHTML = `
          <h3>${asset.name}</h3>
          <p>--</p>
          <small>${asset.ticker}</small>
        `;

        console.warn(
          `⚠️ CoinGecko price unavailable for ${asset.name} (${asset.id})`
        );
      }

      container.appendChild(card);
    });

  } catch (error) {
    console.error('❌ Error fetching CoinGecko market data:', error);

    // Do not destroy the existing market block.
    // Show 5 cards with placeholders instead.
    container.innerHTML = '';

    ASSETS.forEach(asset => {
      const card = document.createElement('div');
      card.className = 'crypto-card';

      card.innerHTML = `
        <h3>${asset.name}</h3>
        <p>--</p>
        <small>${asset.ticker}</small>
      `;

      container.appendChild(card);
    });
  }
}

// ================== Init ==================
fetchMood();
fetchMarketData();

// ================== Auto refresh ==================
// Every 5 minutes
setInterval(fetchMood, 5 * 60 * 1000);
setInterval(fetchMarketData, 5 * 60 * 1000);
