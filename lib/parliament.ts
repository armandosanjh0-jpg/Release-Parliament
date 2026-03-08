import { Bill, BillWithVotes } from '@/types/parliament';

const OPEN_PARLIAMENT = process.env.OPEN_PARLIAMENT_API ?? 'https://api.openparliament.ca';
const LEGISINFO = process.env.LEGISINFO_BASE_URL ?? 'https://www.parl.ca/legisinfo/en';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`Upstream error ${response.status}: ${url}`);
  return response.json() as Promise<T>;
}

interface OpenParliamentBillResponse {
  objects: Array<{ id: number; number: string; name: string; status_code: string; session: string; url: string }>;
}

export async function getBills(params: { page?: number; q?: string; status?: string } = {}): Promise<Bill[]> {
  const query = new URLSearchParams({ limit: '20', offset: String(((params.page ?? 1) - 1) * 20) });
  if (params.q) query.set('q', params.q);
  if (params.status) query.set('status_code', params.status);
  query.set('introduced__gte', '2005-01-01');

  const data = await fetchJson<OpenParliamentBillResponse>(`${OPEN_PARLIAMENT}/bills/?${query.toString()}`);
  return data.objects.map((b) => ({
    id: String(b.id),
    number: b.number,
    title: b.name,
    status: b.status_code,
    session: b.session,
    sourceUrl: `${OPEN_PARLIAMENT}${b.url}`,
    summary: `Official bill record from OpenParliament for ${b.number}.`
  }));
}

interface OpenParliamentVoteResponse {
  objects: Array<{ yea_total: number; nay_total: number; related_bill?: { id: number } }>;
}

export async function getBillById(id: string): Promise<BillWithVotes | null> {
  const bills = await getBills();
  const bill = bills.find((b) => b.id === id);
  if (!bill) return null;

  const voteData = await fetchJson<OpenParliamentVoteResponse>(`${OPEN_PARLIAMENT}/votes/?bill_id=${id}`);
  const first = voteData.objects[0];

  return {
    ...bill,
    textUrl: `${LEGISINFO}`,
    voteBreakdown: first ? { yea: first.yea_total, nay: first.nay_total } : undefined,
    votes: []
  };
}

export async function getRecentVotesSince(date = '2025-01-01') {
  return fetchJson(`${OPEN_PARLIAMENT}/votes/?date__gte=${date}`);
}
