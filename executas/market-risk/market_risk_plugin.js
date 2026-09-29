#!/usr/bin/env node
const readline = require("readline");

const BACKEND = "https://blackbitswan.onrender.com";

const MANIFEST = {
  display_name: "Blackbitswan Market Risk",
  version: "0.1.0",
  description: "Retrieves the current Blackbitswan market mood and risk signal.",
  tools: [
    {
      name: "market_risk",
      description: "Fetch the current Blackbitswan market mood and return a compact risk-intelligence signal.",
      parameters: []
    }
  ],
  runtime: { type: "node", min_version: "18.0.0" }
};

function response(id, result, error) {
  const out = { jsonrpc: "2.0", id };
  if (error !== undefined) out.error = error;
  else out.result = result;
  return out;
}

async function marketRisk() {
  const r = await fetch(BACKEND + "/api/mood");
  if (!r.ok) throw new Error("Backend HTTP " + r.status);
  const data = await r.json();
  const mood = Number(data.mood_percent);
  if (!Number.isFinite(mood)) throw new Error("Invalid mood_percent");
  return {
    mood_percent: mood,
    interpretation: mood < 30 ? "high stress" : mood < 50 ? "cautious" : mood < 70 ? "balanced" : "risk-on",
    source: "Blackbitswan backend",
    timestamp: new Date().toISOString()
  };
}

async function handle(line) {
  let req;
  try { req = JSON.parse(line); }
  catch { return response(null, undefined, { code: -32700, message: "Parse error" }); }

  if (req.method === "describe") return response(req.id, MANIFEST);
  if (req.method === "health") return response(req.id, { status: "healthy", version: MANIFEST.version });

  if (req.method === "market_risk") {
    try {
      return response(req.id, await marketRisk());
    } catch (e) {
      return response(req.id, undefined, { code: -32603, message: e.message });
    }
  }

  return response(req.id, undefined, { code: -32601, message: "Method not found: " + req.method });
}

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  if (!line.trim()) return;
  const out = await handle(line.trim());
  process.stdout.write(JSON.stringify(out) + "\n");
});
