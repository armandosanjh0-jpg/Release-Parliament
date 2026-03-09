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

type OpenParliamentBill = {
  id: number;
  number: string;
  name?: string;
  title?: string;
  status_code?: string;
  session?: string;
  url?: string;
  short_title?: string;
};

interface OpenParliamentBillListResponse {
  objects: OpenParliamentBill[];
}

interface OpenParliamentVoteResponse {
  objects: Array<{ yea_total: number; nay_total: number }>;
}

function mapBill(bill: OpenParliamentBill): Bill {
  return {
    id: String(bill.id),
    number: bill.number,
    title: bill.name ?? bill.title ?? bill.short_title ?? `Bill ${bill.number}`,
    status: bill.status_code ?? 'unknown',
    session: bill.session ?? 'unknown',
    sourceUrl: bill.url ? `${OPEN_PARLIAMENT}${bill.url}` : `${OPEN_PARLIAMENT}/bills/${bill.id}/`,
    summary: `Official bill record from OpenParliament for ${bill.number}.`
  };
}

export async function getBills(params: { page?: number; q?: string; status?: string } = {}): Promise<Bill[]> {
  const query = new URLSearchParams({
    limit: '20',
    offset: String((Math.max(1, params.page ?? 1) - 1) * 20),
    introduced__gte: '2005-01-01'
  });
  if (params.q) query.set('q', params.q);
  if (params.status) query.set('status_code', params.status);

  const data = await fetchJson<OpenParliamentBillListResponse>(`${OPEN_PARLIAMENT}/bills/?${query.toString()}`);
  return data.objects.map(mapBill);
}

export async function getBillById(id: string): Promise<BillWithVotes | null> {
  const billData = await fetchJson<OpenParliamentBill>(`${OPEN_PARLIAMENT}/bills/${id}/`).catch(() => null);
  if (!billData) return null;

  const bill = mapBill(billData);
  const voteData = await fetchJson<OpenParliamentVoteResponse>(`${OPEN_PARLIAMENT}/votes/?bill_id=${id}`).catch(() => ({ objects: [] }));
  const first = voteData.objects[0];

  return {
    ...bill,
    textUrl: LEGISINFO,
    voteBreakdown: first ? { yea: first.yea_total, nay: first.nay_total } : undefined,
    votes: []
  };
}

export async function getRecentVotesSince(date = '2025-01-01') {
  return fetchJson(`${OPEN_PARLIAMENT}/votes/?date__gte=${date}`);
}
