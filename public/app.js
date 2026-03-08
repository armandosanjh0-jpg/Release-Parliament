const billList = document.getElementById('billList');
const detail = document.getElementById('billDetail');
const fromYearInput = document.getElementById('fromYear');
let activeBillId = null;

const elements = {
  title: document.getElementById('billTitle'),
  meta: document.getElementById('billMeta'),
  summary: document.getElementById('billSummary'),
  text: document.getElementById('billText'),
  mpVotes: document.getElementById('mpVotes'),
  senatorVotes: document.getElementById('senatorVotes'),
  citizenTotals: document.getElementById('citizenVoteTotals'),
  synopsisQuestion: document.getElementById('synopsisQuestion'),
  synopsisLens: document.getElementById('synopsisLens'),
  synopsisOutput: document.getElementById('synopsisOutput')
};

async function loadBills() {
  const fromYear = Number(fromYearInput.value || 2005);
  const response = await fetch(`/api/bills?fromYear=${fromYear}`);
  const bills = await response.json();

  billList.innerHTML = '';
  bills
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((bill) => {
      const card = document.createElement('article');
      card.className = 'bill-card';
      card.innerHTML = `
        <h3>${bill.title}</h3>
        <p><strong>${bill.id}</strong> · ${bill.session} · ${bill.status}${bill.upcoming ? ' (Upcoming vote)' : ''}</p>
        <p>${bill.summary}</p>
        <button data-id="${bill.id}">Open bill</button>
      `;
      card.querySelector('button').addEventListener('click', () => showBill(bill.id));
      billList.appendChild(card);
    });
}

function renderVotes(list, items, formatter) {
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<li>No votes yet.</li>';
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = formatter(item);
    list.appendChild(li);
  });
}

function renderCitizenTotals(citizenVotes) {
  elements.citizenTotals.textContent = `Citizen totals — Yea: ${citizenVotes.yea}, Nay: ${citizenVotes.nay}, Abstain: ${citizenVotes.abstain}`;
}

async function showBill(billId) {
  const response = await fetch(`/api/bills/${encodeURIComponent(billId)}`);
  const bill = await response.json();
  activeBillId = bill.id;
  detail.classList.remove('hidden');

  elements.title.textContent = `${bill.title} (${bill.id})`;
  elements.meta.textContent = `${bill.session} · ${bill.date} · ${bill.status}`;
  elements.summary.textContent = bill.summary;
  elements.text.textContent = bill.fullText;

  renderVotes(elements.mpVotes, bill.mpVotes, (vote) => `${vote.name} (${vote.party}, ${vote.riding || 'N/A'}) — ${vote.vote}`);
  renderVotes(elements.senatorVotes, bill.senatorVotes, (vote) => `${vote.name} (${vote.group}, ${vote.province || 'N/A'}) — ${vote.vote}`);
  renderCitizenTotals(bill.citizenVotes);

  elements.synopsisOutput.textContent = '';
}

async function castVote(vote) {
  if (!activeBillId) return;
  const response = await fetch(`/api/bills/${encodeURIComponent(activeBillId)}/cast-vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vote })
  });
  const payload = await response.json();
  renderCitizenTotals(payload.citizenVotes);
}

async function askSynopsis() {
  if (!activeBillId) return;
  elements.synopsisOutput.textContent = 'Generating synopsis...';

  const response = await fetch(`/api/bills/${encodeURIComponent(activeBillId)}/synopsis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: elements.synopsisQuestion.value.trim(),
      lens: elements.synopsisLens.value
    })
  });
  const payload = await response.json();
  elements.synopsisOutput.textContent = `Source: ${payload.source}\n\n${payload.synopsis}`;
}

document.getElementById('refreshBtn').addEventListener('click', loadBills);
document.querySelectorAll('.vote-actions button').forEach((button) => {
  button.addEventListener('click', () => castVote(button.dataset.vote));
});
document.getElementById('askSynopsis').addEventListener('click', askSynopsis);

loadBills();
