const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const citizenVotes = new Map();

// ─── Bill data cache ──────────────────────────────────────────────────────────
let billsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

// PRIMARY: Official Parliament of Canada LEGISinfo JSON feed
// Covers current/latest session, always up to date, no API key or rate limits
async function fetchFromLegisinfo() {
  const res = await fetch('https://www.parl.ca/legisinfo/en/bills/json', {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Release-Parliament/1.0 (open source civic tool)' }
  });
  if (!res.ok) throw new Error(`LEGISinfo error: ${res.status}`);
  const data = await res.json();
  const items = data.Bills || data.bills || (Array.isArray(data) ? data : []);
  return items.map(normalizeLegisinfoBill);
}

function normalizeLegisinfoBill(b) {
  const parlNum = b.ParliamentNumber || b.parliamentNumber || '';
  const sessNum = b.SessionNumber || b.sessionNumber || '';
  const session = parlNum && sessNum ? `${parlNum}-${sessNum}` : '';
  const billNum = b.NumberCode || b.numberCode || b.BillNumber || '';
  const isLaw = !!(b.ReceivedRoyalAssentDateTime || b.receivedRoyalAssentDateTime);
  const statusName = b.StatusName || b.statusName || b.LatestBillEventStatusName || 'In progress';
  const legisInfoUrl = billNum && session
    ? `https://www.parl.ca/legisinfo/en/bill/${session}/${billNum.toLowerCase()}`
    : '';
  const rawDate = b.PassedFirstReadingDateTime || b.passedFirstReadingDateTime || '';
  const date = rawDate ? rawDate.slice(0, 10) : '2005-01-01';
  const sponsorFirst = b.SponsorPersonOfficialFirstName || b.sponsorPersonOfficialFirstName || '';
  const sponsorLast = b.SponsorPersonOfficialLastName || b.sponsorPersonOfficialLastName || '';

  return {
    id: billNum,
    title: b.LongTitle || b.longTitle || b.ShortTitle || b.shortTitle || billNum,
    shortTitle: b.ShortTitle || b.shortTitle || '',
    summary: statusName,
    status: statusName,
    isLaw,
    session,
    date,
    fullTextUrl: legisInfoUrl,
    legisInfoUrl,
    billType: b.BillDocumentTypeName || b.billDocumentTypeName || '',
    sponsor: sponsorFirst ? `${sponsorFirst} ${sponsorLast}`.trim() : '',
    voteUrls: [],
    mpVotes: [],
    senatorVotes: []
  };
}

// FALLBACK: OpenParliament for older sessions
async function fetchFromOpenParliament(endpoint) {
  const res = await fetch(`https://api.openparliament.ca${endpoint}`, {
    headers: { 'Accept': 'application/json', 'API-Version': 'v1' }
  });
  if (!res.ok) throw new Error(`OpenParliament error: ${res.status}`);
  return res.json();
}

async function fetchOlderBills() {
  const bills = [];
  let url = '/bills/?limit=50&offset=0';
  while (url) {
    const data = await fetchFromOpenParliament(url);
    for (const b of (data.objects || [])) {
      if (b.session && b.session.startsWith('45')) continue; // skip — LEGISinfo covers session 45
      const statusText = b.status?.en || b.status_code || 'Unknown';
      bills.push({
        id: b.number,
        title: b.name?.en || b.short_title?.en || b.number,
        shortTitle: b.short_title?.en || '',
        summary: statusText,
        status: statusText,
        isLaw: !!b.law,
        session: b.session,
        date: b.introduced || '2005-01-01',
        fullTextUrl: b.text_url || b.legisinfo_url || '',
        legisInfoUrl: b.legisinfo_url || '',
        billType: '',
        sponsor: '',
        voteUrls: b.vote_urls || [],
        mpVotes: [],
        senatorVotes: []
      });
    }
    url = data.pagination?.next_url || null;
    if (bills.length >= 500) break;
  }
  return bills;
}

async function loadBills() {
  const now = Date.now();
  if (billsCache && (now - cacheTimestamp) < CACHE_TTL_MS) return billsCache;

  try {
    console.log('Fetching bills from LEGISinfo...');
    const current = await fetchFromLegisinfo();
    console.log(`LEGISinfo returned ${current.length} bills.`);

    let older = [];
    try {
      older = await fetchOlderBills();
      console.log(`OpenParliament returned ${older.length} older bills.`);
    } catch (e) {
      console.warn('OpenParliament fallback failed:', e.message);
    }

    // Merge: LEGISinfo bills take priority, older bills fill in history
    const idSet = new Set(current.map(b => b.id));
    const merged = [...current, ...older.filter(b => !idSet.has(b.id))];
    billsCache = merged;
    cacheTimestamp = now;
    console.log(`Total cached: ${billsCache.length} bills.`);
  } catch (err) {
    console.error('LEGISinfo fetch failed:', err.message);
    if (!billsCache) billsCache = [];
  }
  return billsCache;
}

async function loadVotesForBill(bill) {
  try {
    if (!bill.voteUrls || bill.voteUrls.length === 0) return [];
    const results = await Promise.all(
      bill.voteUrls.slice(0, 10).map(u => fetchFromOpenParliament(u).catch(() => null))
    );
    return results.filter(Boolean).map(v => ({
      description: v.description?.en || 'Vote',
      date: v.date || '',
      yea: v.yea_total || 0,
      nay: v.nay_total || 0,
      paired: v.paired_total || 0,
      result: v.result || '',
    }));
  } catch {
    return [];
  }
}
// ─────────────────────────────────────────────────────────────────────────────

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
      catch (e) { reject(new Error('Invalid JSON payload')); }
    });
    req.on('error', reject);
  });
}

function generateFallbackSynopsis(bill, question, lens = 'right') {
  const framing = lens === 'right'
    ? 'From a centre-right perspective, this bill is relevant to fiscal discipline, energy security, public safety, and limited bureaucracy.'
    : 'From a neutral civic perspective, here is what this bill means for Canadians.';
  const sponsor = bill.sponsor ? ` Sponsored by ${bill.sponsor}.` : '';
  if (question) {
    return `Question: ${question}\n\n${framing} ${bill.title} (${bill.id}) — Status: ${bill.status}.${sponsor}`;
  }
  return `${bill.title} (${bill.id}), Session ${bill.session}. Status: ${bill.status}.${sponsor} ${framing}`;
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
    ? `Bill: ${bill.title}\nStatus: ${bill.status}\nSponsor: ${bill.sponsor || 'Unknown'}\n\nUser question: ${question}\n\n${lensInstruction}\nWrite a short plain-language synopsis for Canadians.`
    : `Provide a short plain-language synopsis for this bill.\nTitle: ${bill.title}\nStatus: ${bill.status}\nSponsor: ${bill.sponsor || 'Unknown'}\n\n${lensInstruction}`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', input: prompt, max_output_tokens: 220 })
  });

  if (!response.ok) {
    return { source: 'local-fallback', synopsis: generateFallbackSynopsis(bill, question, lens) };
  }

  const payload = await response.json();
  const text = payload.output_text || payload.output?.[0]?.content?.[0]?.text;
  return { source: 'openai', synopsis: text || generateFallbackSynopsis(bill, question, lens) };
}

function getContentType(filePath) {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
  return types[path.extname(filePath)] || 'application/octet-stream';
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
      const filtered = bills.filter(b => Number(b.date.slice(0, 4)) >= fromYear);
      sendJson(res, 200, filtered);
      return;
    }

    const billRoute = parseBillId(url.pathname);
    if (!billRoute) { serveStatic(req, res, url.pathname); return; }

    const bills = await loadBills();
    const bill = bills.find(b => b.id === billRoute.billId);
    if (!bill) { notFound(res); return; }

    if (req.method === 'GET' && billRoute.action === '') {
      const votes = await loadVotesForBill(bill);
      bill.mpVotes = votes;
      sendJson(res, 200, { ...bill, citizenVotes: citizenVotes.get(bill.id) || { yea: 0, nay: 0, abstain: 0 } });
      return;
    }

    if (req.method === 'POST' && billRoute.action === '/cast-vote') {
      try {
        const payload = await readRequestBody(req);
        const vote = String(payload.vote || '').toLowerCase();
        if (!['yea', 'nay', 'abstain'].includes(vote)) { sendJson(res, 400, { error: 'vote must be yea, nay, or abstain' }); return; }
        const current = citizenVotes.get(bill.id) || { yea: 0, nay: 0, abstain: 0 };
        current[vote] += 1;
        citizenVotes.set(bill.id, current);
        sendJson(res, 200, { billId: bill.id, citizenVotes: current });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
      return;
    }

    if (req.method === 'POST' && billRoute.action === '/synopsis') {
      try {
        const payload = await readRequestBody(req);
        const question = payload.question ? String(payload.question) : '';
        const lens = payload.lens === 'neutral' ? 'neutral' : 'right';
        const synopsis = await maybeGenerateGptSynopsis(bill, question, lens);
        sendJson(res, 200, synopsis);
      } catch (e) { sendJson(res, 500, { error: 'Unable to generate synopsis' }); }
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
