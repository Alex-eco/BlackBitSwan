const API = '/api';
async function fetchPrices(){
  try{
    const r = await fetch(API + '/prices');
    const data = await r.json();
    const mapping = {
      bitcoin: 'Bitcoin (BTC)',
      ethereum: 'Ethereum (ETH)',
      binancecoin: 'Binance Coin (BNB)',
      ripple: 'Ripple (XRP)',
      cardano: 'Cardano (ADA)'
    };
    const el = document.getElementById('prices');
    el.innerHTML='';
    for(const [k,v] of Object.entries(data)){
      const div = document.createElement('div');
      div.className='price-item';
      div.innerHTML=`<h3>${mapping[k] || k}</h3><div>USD ${v.usd.toLocaleString()}</div><div>24h ${v.usd_24h_change?.toFixed(2) || '0'}%</div>`;
      el.appendChild(div);
    }
  }catch(e){console.error(e);document.getElementById('prices').textContent='Price fetch error';}
}
async function fetchMood(){
  try{
    const r = await fetch(API + '/mood');
    const j = await r.json();
    const p = j.mood_percent || 50;
    document.getElementById('gaugeFill').style.width = p + '%';
    document.getElementById('moodPercent').textContent = p;
    document.getElementById('moodTime').textContent = j.timestamp || '-';
    const headlines = document.getElementById('headlines');
    headlines.innerHTML = '';
    (j.raw_headlines || []).slice(0,40).forEach(h=>{
      const a = document.createElement('article');
      a.innerHTML = `<strong>${h.site}:</strong> ${h.text}`;
      headlines.appendChild(a);
    });
  }catch(e){console.error(e);document.getElementById('moodPercent').textContent='-';}
}
fetchPrices();
fetchMood();
setInterval(fetchPrices, 60*1000);
setInterval(fetchMood, 5*60*1000);