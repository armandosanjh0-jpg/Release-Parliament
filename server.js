const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const citizenVotes = new Map();

// ─── OpenParliament live data cache ───────────────────────────────────────────
let billsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // refresh every 10 minutes

async function fetchFromOpenParliament(endpoint) {
  const res = await fetch(`https://api.openparliament.ca${endpoint}`, {
    headers: {
      'Accept': 'application/json',
      'API-Version': 'v1'
    }
  });
  if (!res.ok) throw new Error(`OpenParliament error: ${res.status}`);
  return res.json();
}

async function fetchAllBills() {
  const bills = [];
  let url = '/bills/?limit=50&offset=0';

  // Paginate through all bills (OpenParliament returns 50 at a time)
  while (url) {
    const data = await fetchFromOpenParliament(url);
    for (const b of data.objects) {
      bills.push(normalizeBill(b));
    }
    url = data.pagination?.next_url || null;
    if (bills.length >= 500) break; // safety cap
  }
  return bills;
}

function normalizeBill(b) {
  // Map OpenParliament's shape to the shape your frontend already expects
  return {
    id: b.number,
    title: b.name?.en || b.number,
    summary: b.law ? 'This bill became law.' : (b.status?.en || 'Status unknown'),
    status: b.status?.en || 'Unknown',
    session: b.session,
    date: b.introduced || '2005-01-01',
    fullText: b.legisinfo_url ? `Full text: ${b.legisinfo_url}` : '',
    url: b.url,
    mpVotes: [],       // loaded on demand per bill
    senatorVotes: []   // loaded on demand per bill
  };
}

async function loadBills() {
  const now = Date.now();
  if (billsCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return billsCache;
  }
  try {
    console.log('Fetching fresh bills from OpenParliament...');
    billsCache = await fetchAllBills();
    cacheTimestamp = now;
    console.log(`Cached ${billsCache.length} bills.`);
  } catch (err) {
    console.error('OpenParliament fetch failed:', err.message);
    // Return stale cache if available, else empty array
    if (!billsCache) billsCache = [];
  }
  return billsCache;
}

async function loadVotesForBill(billId) {
  try {
    // e.g. /votes/?bill=C-11
    const data = await fetchFromOpenParliament(`/votes/?bill=${encodeURIComponent(billId)}&limit=50`);
    return data.objects || [];
  } catch {
    return [];
  }
}
// ──────────────────────────────────────────────────────────────────────────────

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function notFound(res) {
  sendJson(res, 404, { error: 'Not found' });
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!body) { resolve({}); return; }
      try { resolve(JSON.parse(body)); }
      catch (error) { reject(new Error('Invalid JSON payload')); }
    });
    req.on('error', reject);
  });
}

function generateFallbackSynopsis(bill, question, lens = 'right') {
  const voteStats = `${bill.mpVotes.length} House votes and ${bill.senatorVotes.length} Senate votes recorded`;
  const framing = lens === 'right'
    ? 'From a centre-right perspective, focus on fiscal discipline, energy security, public safety, and limited bureaucracy.'
    : 'From a neutral civic perspective, focus on practical effects for Canadians.';
  if (question) {
    return `Question: ${question}\n\n${framing} ${bill.title} (${bill.id}) focuses on: ${bill.summary} Current status is ${bill.status} with ${voteStats}.`;
  }
  return `${framing} ${bill.title} (${bill.id}) in ${bill.session} — ${bill.summary} Status: ${bill.status}. ${voteStats}.`;
}

async function maybeGenerateGptSynopsis(bill, question, lens = 'right') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { source: 'local-fallback', synopsis: generateFallbackSynopsis(bill, question, lens) };
  }

  const lensInstruction = lens === 'right'
    ? 'Adopt a centre-right Canadian policy lens (fiscal prudence, stronger public safety, support for domestic energy and efficient regulation). Be factual and concise.'
    : 'Use a neutral, non-partisan civic lens. Be factual and concise.';

  const prompt = question
    ? `Bill: ${bill.title}\nStatus: ${bill.status}\nSummary: ${bill.summary}\n\nUser question: ${question}\n\n${lensInstruction}\nWrite a short plain-language synopsis for Canadians.`
    : `Provide a short plain-language synopsis for this bill.\nTitle: ${bill.title}\nSummary: ${bill.summary}\n\n${lensInstruction}`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: prompt,
      max_output_tokens: 220
    })
  });

  if (!response.ok) {
    return { source: 'local-fallback', synopsis: generateFallbackSynopsis(bill, question, lens) };
  }

  const payload = await response.json();
  const text = payload.output_text || payload.output?.[0]?.content?.[0]?.text;
  return { source: 'openai', synopsis: text || generateFallbackSynopsis(bill, question, lens) };
}

function getContentType(filePath) {
  const ext = path.extname(filePath);
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  };
  return types[ext] || 'application/octet-stream';
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!filePath.startsWith(PUBLIC_DIR)) { notFound(res); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { notFound(res); return; }
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  });
}

function parseBillId(pathname) {
  const match = pathname.match(/^\/api\/bills\/([^/]+)(\/synopsis|\/cast-vote)?$/);
  if (!match) return null;
  return { billId: decodeURIComponent(match[1]), action: match[2] || '' };
}

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/bills') {
      const bills = await loadBills();
      const fromYear = Number(url.searchParams.get('fromYear') || 2005);
      const filtered = bills.filter((bill) => Number(bill.date.slice(0, 4)) >= fromYear);
      sendJson(res, 200, filtered);
      return;
    }

    const billRoute = parseBillId(url.pathname);
    if (!billRoute) {
      serveStatic(req, res, url.pathname);
      return;
    }

    const bills = await loadBills();
    const bill = bills.find((item) => item.id === billRoute.billId);
    if (!bill) { notFound(res); return; }

    if (req.method === 'GET' && billRoute.action === '') {
      // Fetch live votes for this specific bill on demand
      const votes = await loadVotesForBill(bill.id);
      bill.mpVotes = votes;
      sendJson(res, 200, {
        ...bill,
        citizenVotes: citizenVotes.get(bill.id) || { yea: 0, nay: 0, abstain: 0 }
      });
      return;
    }

    if (req.method === 'POST' && billRoute.action === '/cast-vote') {
      try {
        const payload = await readRequestBody(req);
        const vote = String(payload.vote || '').toLowerCase();
        if (!['yea', 'nay', 'abstain'].includes(vote)) {
          sendJson(res, 400, { error: 'vote must be yea, nay, or abstain' });
          return;
        }
        const current = citizenVotes.get(bill.id) || { yea: 0, nay: 0, abstain: 0 };
        current[vote] += 1;
        citizenVotes.set(bill.id, current);
        sendJson(res, 200, { billId: bill.id, citizenVotes: current });
      } catch (error) {
        sendJson(res, 400, { error: error.message });
      }
      return;
    }

    if (req.method === 'POST' && billRoute.action === '/synopsis') {
      try {
        const payload = await readRequestBody(req);
        const question = payload.question ? String(payload.question) : '';
        const lens = payload.lens === 'neutral' ? 'neutral' : 'right';
        const synopsis = await maybeGenerateGptSynopsis(bill, question, lens);
        sendJson(res, 200, synopsis);
      } catch (error) {
        sendJson(res, 500, { error: 'Unable to generate synopsis' });
      }
      return;
    }

    notFound(res);
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`Release Parliament running on http://localhost:${PORT}`);
  });
}

module.exports = { createServer, loadBills, generateFallbackSynopsis };
