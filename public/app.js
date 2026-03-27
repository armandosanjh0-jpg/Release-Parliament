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
        <p>
          <strong>${bill.id}</strong> · ${bill.session} · ${bill.status}
          ${bill.isLaw ? ' <span style="color:green">(Law)</span>' : ''}
          ${bill.upcoming ? ' (Upcoming vote)' : ''}
        </p>
        <p>${bill.summary}</p>
        <button data-id="${bill.id}">Open bill</button>
      `;
      card.querySelector('button').addEventListener('click', () => showBill(bill.id));
      billList.appendChild(card);
    });
}

function renderVotes(list, items) {
  list.innerHTML = '';
  if (!items || !items.length) {
    list.innerHTML = '<li>No votes recorded.</li>';
    return;
  }
  items.forEach((vote) => {
    const li = document.createElement('li');
    // vote shape from server: { description, date, yea, nay, paired, result, url }
    const resultText = vote.result ? ` — ${vote.result}` : '';
    const dateText = vote.date ? ` (${vote.date})` : '';
    li.textContent = `${vote.description}${dateText}: Yea ${vote.yea}, Nay ${vote.nay}${resultText}`;
    list.appendChild(li);
  });
}

function renderCitizenTotals(citizenVotes) {
  elements.citizenTotals.textContent =
    `Citizen totals — Yea: ${citizenVotes.yea}, Nay: ${citizenVotes.nay}, Abstain: ${citizenVotes.abstain}`;
}

async function showBill(billId) {
  const response = await fetch(`/api/bills/${encodeURIComponent(billId)}`);
  const bill = await response.json();
  activeBillId = bill.id;
  detail.classList.remove('hidden');

  elements.title.textContent = `${bill.title} (${bill.id})`;
  elements.meta.textContent = `${bill.session} · ${bill.date} · ${bill.status}`;
  elements.summary.textContent = bill.summary;

  // Render full bill text as a clickable link instead of plain text
  if (bill.fullTextUrl) {
    elements.text.innerHTML =
      `<a href="${bill.fullTextUrl}" target="_blank" rel="noopener">Read full bill text on parl.ca ↗</a>`;
  } else if (bill.legisInfoUrl) {
    elements.text.innerHTML =
      `<a href="${bill.legisInfoUrl}" target="_blank" rel="noopener">View bill info on LEGISinfo ↗</a>`;
  } else {
    elements.text.textContent = 'No full text link available.';
  }

  // mpVotes now holds all recorded votes (House + Senate mixed from vote_urls)
  renderVotes(elements.mpVotes, bill.mpVotes);

  // senatorVotes is reserved — show a note for now
  elements.senatorVotes.innerHTML = '<li>Senate vote breakdown coming soon.</li>';

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
