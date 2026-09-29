import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";

const TOOL_FALLBACK = "tool-test-blackbitswan-market-risk-12345678";
const TOOL_ID = (typeof window !== "undefined" && window.__ANNA_TOOL_IDS__ && window.__ANNA_TOOL_IDS__["market-risk"]) || TOOL_FALLBACK;

const moodEl = document.getElementById("mood");
const interpretationEl = document.getElementById("interpretation");
const statusEl = document.getElementById("status");
const button = document.getElementById("scan");

let anna = null;

async function scan() {
  button.disabled = true;
  statusEl.textContent = "Scanning market risk…";
  try {
    const result = await anna.tools.invoke({
      tool_id: TOOL_ID,
      method: "market_risk",
      args: {}
    });
    const data = result?.data || result;
    moodEl.textContent = Number(data.mood_percent).toFixed(0) + "%";
    interpretationEl.textContent = data.interpretation || "market signal received";
    statusEl.textContent = "Updated " + new Date(data.timestamp || Date.now()).toLocaleTimeString();
  } catch (e) {
    statusEl.textContent = "Scan failed: " + (e?.message || e);
  } finally {
    button.disabled = false;
  }
}

async function init() {
  try {
    anna = await AnnaAppRuntime.connect();
    statusEl.textContent = "Connected to Anna";
    await scan();
  } catch (e) {
    statusEl.textContent = "Anna runtime unavailable";
    console.error(e);
  }
}

button.addEventListener("click", scan);
init();
