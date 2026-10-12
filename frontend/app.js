// BlackBitSwan eAI landing page.
// The site intentionally avoids displaying fabricated market prices or forecasts.
// Live mood is shown only when the backend returns a valid value.
const API_BASE = 'https://blackbitswan.onrender.com';

async function fetchMood() {
  const element = document.getElementById('mood-value');
  if (!element) return;
  try {
    const response = await fetch(API_BASE + '/api/mood');
    if (!response.ok) throw new Error('Mood HTTP ' + response.status);
    const data = await response.json();
    if (typeof data.mood_percent === 'number' && Number.isFinite(data.mood_percent)) {
      element.textContent = data.mood_percent + '%';
    } else {
      element.textContent = 'Unavailable';
    }
  } catch (error) {
    console.warn('Market mood is currently unavailable:', error);
    element.textContent = 'Unavailable';
  }
}
fetchMood();
setInterval(fetchMood, 5 * 60 * 1000);
