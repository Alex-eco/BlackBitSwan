import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from "cheerio";   // правильный импорт для ESM
import cors from 'cors';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 10000;
const SCAN_INTERVAL_MINUTES = parseInt(process.env.SCAN_INTERVAL_MINUTES || '10', 10);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const SITES = [
  { name: 'CryptoPanic', url: 'https://cryptopanic.com/' },
  { name: 'CoinSpectator', url: 'https://coinspectator.com/' },
  { name: 'CoinMarketCap', url: 'https://coinmarketcap.com/headlines/news/' },
  { name: 'Forbes', url: 'https://www.forbes.com/digital-assets/' }
];

let lastScan = { timestamp: null, total_found: 0, total_good: 0, per_site: {}, mood_percent: 50, raw_headlines: [] };

async function fetchPageText(url){
  try{
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if(!res.ok) return '';
    return await res.text();
  }catch(e){ return ''; }
}

function extractHeadlines(html, site){
  try{
    const $ = cheerio.load(html);
    const set = new Set();
    $('a, h1, h2, h3').each((i, el) => {
      const t = $(el).text().trim();
      if(t.length>30 && t.length<300) set.add(t);
    });
    return Array.from(set).slice(0,40);
  }catch(e){ return []; }
}

async function analyzeWithOpenAI(headlines){
  if(!openai){
    const pos = ['gain','surge','rally','bull','up','record','increase','soar','optimis','beat'];
    let good=0;
    for(const h of headlines){
      const s=h.toLowerCase();
      for(const p of pos) if(s.includes(p)){ good++; break; }
    }
    return { good, total: headlines.length, details: [] };
  }
  try{
    const prompt = `Classify each headline as GOOD, BAD, or NEUTRAL for the overall crypto market. Return JSON array with objects { "headline": "...", "label": "GOOD" } only.

Headlines:\n${headlines.map((h,i)=>`${i+1}. ${h}`).join('\n')}`;
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 800
    });
    const content = resp.choices?.[0]?.message?.content || '';
    const jsonStart = content.indexOf('[');
    const json = jsonStart>=0 ? content.slice(jsonStart) : content;
    let parsed = JSON.parse(json);
    const good = parsed.filter(p=>/GOOD/i.test(p.label)).length;
    return { good, total: parsed.length, details: parsed };
  }catch(e){
    const pos = ['gain','surge','rally','bull','up','record','increase','soar','optimis','beat'];
    let good=0;
    for(const h of headlines){
      const s=h.toLowerCase();
      for(const p of pos) if(s.includes(p)){ good++; break; }
    }
    return { good, total: headlines.length, details: [] };
  }
}

async function performScan(){
  try{
    const all = [];
    const per = {};
    for(const s of SITES){
      const html = await fetchPageText(s.url);
      const heads = extractHeadlines(html, s.name);
      per[s.name]=heads.length;
      heads.forEach(h=> all.push({ site: s.name, text: h }));
    }
    const texts = all.map(a=>a.text);
    const analysis = await analyzeWithOpenAI(texts);
    const total = analysis.total || texts.length;
    const good = analysis.good || 0;
    const mood = total>0 ? Math.round((good/total)*100) : 50;
    lastScan = { timestamp: new Date().toISOString(), total_found: total, total_good: good, per_site: per, mood_percent: mood, raw_headlines: all.slice(0,200) };
    console.log('scan', lastScan.timestamp, 'mood', mood);
  }catch(e){ console.error('scan fail', e); }
}

performScan();
setInterval(performScan, Math.max(1, SCAN_INTERVAL_MINUTES)*60*1000);

app.get('/api/mood',(req,res)=> res.json(lastScan));

app.get('/api/prices', async (req,res)=>{
  try{
    const url='https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,ripple,cardano&vs_currencies=usd';
    const r = await fetch(url);
    const j = await r.json();
    res.json(j);
  }catch(e){ res.status(500).json({ error: 'price fetch failed' }); }
});

app.get('/api/contact', (req,res)=> res.json({ email:'rstyleh@gmail.com', telegram:'@blackbitswan' }));

app.get('*', (req,res)=> res.sendFile(path.join(__dirname, '../frontend/index.html')));

app.listen(PORT, ()=> console.log('BlackBitSwan backend on', PORT));
