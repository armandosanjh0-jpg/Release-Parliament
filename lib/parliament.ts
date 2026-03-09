import { CANADA_BILLS_2005_2026 } from '@/lib/canada-bills';
import { Bill, BillWithVotes } from '@/types/parliament';

const OPEN_PARLIAMENT = process.env.OPEN_PARLIAMENT_API ?? 'https://api.openparliament.ca';

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

function mapBillFromApi(bill: OpenParliamentBill): Bill {
  return {
    id: `op-${bill.id}`,
    number: bill.number,
    title: bill.name ?? bill.title ?? bill.short_title ?? `Bill ${bill.number}`,
    status: bill.status_code ?? 'unknown',
    session: bill.session ?? 'unknown',
    sourceUrl: bill.url ? `${OPEN_PARLIAMENT}${bill.url}` : `${OPEN_PARLIAMENT}/bills/${bill.id}/`,
    summary: `Official bill record from OpenParliament for ${bill.number}.`
  };
}

export async function getBills(params: { page?: number; q?: string; status?: string } = {}): Promise<Bill[]> {
  let upstream: Bill[] = [];
  try {
    const query = new URLSearchParams({ limit: '20', offset: '0', introduced__gte: '2005-01-01' });
    if (params.q) query.set('q', params.q);
    if (params.status) query.set('status_code', params.status);
    const data = await fetchJson<OpenParliamentBillListResponse>(`${OPEN_PARLIAMENT}/bills/?${query.toString()}`);
    upstream = data.objects.map(mapBillFromApi);
  } catch {
    upstream = [];
  }

  const local = CANADA_BILLS_2005_2026.map((b) => ({
    id: b.id,
    number: b.number,
    title: b.title,
    status: b.status,
    session: b.session,
    introducedAt: b.introducedAt,
    sponsor: b.sponsor,
    type: b.type,
    summary: b.summary,
    sourceUrl: b.sourceUrl
  }));

  let combined = [...local, ...upstream];
  if (params.q) {
    const q = params.q.toLowerCase();
    combined = combined.filter((b) => `${b.number} ${b.title} ${b.summary ?? ''}`.toLowerCase().includes(q));
  }
  if (params.status) {
    combined = combined.filter((b) => b.status.toLowerCase().includes(params.status!.toLowerCase()));
  }

  combined.sort((a, b) => (b.introducedAt ?? '').localeCompare(a.introducedAt ?? ''));
  const page = Math.max(1, params.page ?? 1);
  return combined.slice((page - 1) * 20, page * 20);
}

export async function getBillById(id: string): Promise<BillWithVotes | null> {
  const local = CANADA_BILLS_2005_2026.find((b) => b.id === id);
  if (local) return local;

  if (!id.startsWith('op-')) return null;
  const apiId = id.replace('op-', '');
  try {
    const billData = await fetchJson<OpenParliamentBill>(`${OPEN_PARLIAMENT}/bills/${apiId}/`);
    return {
      ...mapBillFromApi(billData),
      textUrl: `${OPEN_PARLIAMENT}/bills/${apiId}/`,
      voteBreakdown: undefined,
      votes: []
    };
  } catch {
    return null;
  }
}

export async function getRecentVotesSince(date = '2025-01-01') {
  return fetchJson(`${OPEN_PARLIAMENT}/votes/?date__gte=${date}`);
}
