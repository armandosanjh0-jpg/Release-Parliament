const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'bills.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const citizenVotes = new Map();

function loadBills() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

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
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON payload'));
      }
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
    return `Question: ${question}\n\n${framing} ${bill.title} (${bill.id}) focuses on: ${bill.summary} The bill text highlights: ${bill.fullText} Current status is ${bill.status} with ${voteStats}.`;
  }

  return `${framing} ${bill.title} (${bill.id}) in ${bill.session} proposes: ${bill.summary} It is currently marked as ${bill.status}, and has ${voteStats}.`;
}

async function maybeGenerateGptSynopsis(bill, question, lens = 'right') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      source: 'local-fallback',
      synopsis: generateFallbackSynopsis(bill, question, lens)
    };
  }

  const lensInstruction = lens === 'right'
    ? 'Adopt a centre-right Canadian policy lens (fiscal prudence, stronger public safety, support for domestic energy and efficient regulation). Be factual and concise.'
    : 'Use a neutral, non-partisan civic lens. Be factual and concise.';

  const prompt = question
    ? `Bill: ${bill.title}\nStatus: ${bill.status}\nText: ${bill.fullText}\n\nUser question: ${question}\n\n${lensInstruction}\nWrite a short plain-language synopsis for Canadians.`
    : `Provide a short plain-language synopsis for this bill.\nTitle: ${bill.title}\nSummary: ${bill.summary}\nText: ${bill.fullText}\n\n${lensInstruction}`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      input: prompt,
      max_output_tokens: 220
    })
  });

  if (!response.ok) {
    return {
      source: 'local-fallback',
      synopsis: generateFallbackSynopsis(bill, question, lens)
    };
  }

  const payload = await response.json();
  const text = payload.output_text || payload.output?.[0]?.content?.[0]?.text;

  return {
    source: 'openai',
    synopsis: text || generateFallbackSynopsis(bill, question, lens)
  };
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
  if (!filePath.startsWith(PUBLIC_DIR)) {
    notFound(res);
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      notFound(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  });
}

function parseBillId(pathname) {
  const match = pathname.match(/^\/api\/bills\/([^/]+)(\/synopsis|\/cast-vote)?$/);
  if (!match) return null;
  return {
    billId: decodeURIComponent(match[1]),
    action: match[2] || ''
  };
}

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/bills') {
      const bills = loadBills();
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

    const bills = loadBills();
    const bill = bills.find((item) => item.id === billRoute.billId);

    if (!bill) {
      notFound(res);
      return;
    }

    if (req.method === 'GET' && billRoute.action === '') {
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

module.exports = {
  createServer,
  loadBills,
  generateFallbackSynopsis
};
