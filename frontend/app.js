const API_URL = "https://blackbitswan.onrender.com/api";

// ================== Fetch crypto mood ==================
async function fetchMood() {
  try {
    const res = await fetch(`${API_URL}/mood`);
    const data = await res.json();
    document.getElementById("mood-value").textContent = `${data.mood}%`;
  } catch (err) {
    console.error("Failed to fetch mood:", err);
  }
}

// ================== Fetch crypto prices ==================
async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano,ripple");
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
    console.error("Failed to fetch prices:", err);
  }
}

// ================== Init ==================
fetchMood();
fetchPrices();
setInterval(fetchMood, 5 * 60 * 1000); // каждые 5 минут
setInterval(fetchPrices, 5 * 60 * 1000);
