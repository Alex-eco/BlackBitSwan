// ================== API base URL ==================
const API_BASE = 'https://blackbitswan.onrender.com';

// ================== Fetch market mood ==================
const moodElement = document.getElementById('mood-value');

async function fetchMood() {
  try {
    const response = await fetch(`${API_BASE}/api/mood`);
    if (!response.ok) throw new Error('Failed to fetch mood');

    const data = await response.json();

    // mood_percent приходит с бэкенда
    if (data && typeof data.mood_percent === 'number') {
      moodElement.textContent = `${data.mood_percent}%`;
    } else {
      console.warn('⚠️ Mood value not found in response');
      moodElement.textContent = '--%';
    }
  } catch (error) {
    console.error('❌ Error fetching market mood:', error);
    moodElement.textContent = '--%';
  }
}

// ================== Fetch crypto prices ==================
async function fetchPrices() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano,ripple"
    );
    if (!res.ok) throw new Error('Failed to fetch prices');

    const coins = await res.json();
    const container = document.getElementById("crypto-prices");
    container.innerHTML = "";

    coins.forEach(c => {
      const card = document.createElement("div");
      card.className = "crypto-card";
      card.innerHTML = `
        <h3>${c.name}</h3>
        <p>$${c.current_price.toLocaleString()}</p>
        <p style="color:${c.price_change_percentage_24h >= 0 ? '#00ffa3' : '#ff4b4b'}">
          ${c.price_change_percentage_24h.toFixed(2)}%
        </p>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("❌ Failed to fetch prices:", err);
  }
}

// ================== Init ==================
fetchMood();
fetchPrices();

// обновление каждые 5 минут
setInterval(fetchMood, 5 * 60 * 1000);
setInterval(fetchPrices, 5 * 60 * 1000);


