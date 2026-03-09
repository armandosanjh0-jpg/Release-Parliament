import { BillCard } from '@/components/BillCard';
import { getBills } from '@/lib/parliament';

type HomeProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const bills = await getBills({
    q: resolvedSearchParams.q,
    status: resolvedSearchParams.status,
    page: Number(resolvedSearchParams.page ?? '1')
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white">
        <h1 className="text-3xl font-bold">Canada Parliament Bills (2005–2026)</h1>
        <p className="mt-2 text-lg">Clear, readable, and simple: search bills, open details, and compare votes.</p>
      </section>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <input name="q" defaultValue={resolvedSearchParams.q} placeholder="Search by bill number or title" className="rounded-lg border p-3 text-lg" aria-label="Search bills" />
        <input name="status" defaultValue={resolvedSearchParams.status} placeholder="Status (e.g. Royal Assent)" className="rounded-lg border p-3 text-lg" aria-label="Filter by status" />
        <select name="page" defaultValue={resolvedSearchParams.page ?? '1'} className="rounded-lg border p-3 text-lg" aria-label="Pagination page">
          <option value="1">Page 1</option><option value="2">Page 2</option><option value="3">Page 3</option>
        </select>
        <button className="rounded-lg bg-blue-700 px-4 py-3 text-lg font-semibold text-white">Apply filters</button>
      </form>

      <section className="grid gap-4">
        {bills.map((bill) => <BillCard key={bill.id} bill={bill} />)}
      </section>
    </div>
  );
}
