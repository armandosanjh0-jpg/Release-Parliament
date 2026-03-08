const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer, loadBills, generateFallbackSynopsis } = require('../server');

test('loadBills includes Canadian records from 2005 and upcoming bill', () => {
  const bills = loadBills();
  assert.ok(bills.some((bill) => bill.date.startsWith('2005')));
  assert.ok(bills.some((bill) => bill.upcoming === true));
  assert.ok(bills.some((bill) => bill.session.includes('Parliament')));
});

test('fallback synopsis supports right lens framing', () => {
  const bill = loadBills()[0];
  const result = generateFallbackSynopsis(bill, 'How does this affect taxes?', 'right');
  assert.match(result, /centre-right perspective/i);
  assert.match(result, /How does this affect taxes\?/);
});

test('GET /api/bills filters by fromYear', async () => {
  const server = createServer().listen(0);
  const port = server.address().port;

  const response = await fetch(`http://127.0.0.1:${port}/api/bills?fromYear=2020`);
  const payload = await response.json();

  assert.ok(Array.isArray(payload));
  assert.ok(payload.every((bill) => Number(bill.date.slice(0, 4)) >= 2020));

  server.close();
});
