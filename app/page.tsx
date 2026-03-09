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
    <div className="space-y-4">
      <section>
        <h1 className="text-2xl font-bold">Canadian Parliament Bill Browser</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Search and filter legislation since 2005 with OpenParliament data.</p>
      </section>
      <form className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <input name="q" defaultValue={resolvedSearchParams.q} placeholder="Search bills" className="rounded border p-2" aria-label="Search bills" />
        <input name="status" defaultValue={resolvedSearchParams.status} placeholder="Status code" className="rounded border p-2" aria-label="Filter by status" />
        <select name="page" defaultValue={resolvedSearchParams.page ?? '1'} className="rounded border p-2" aria-label="Pagination page">
          <option value="1">Page 1</option><option value="2">Page 2</option><option value="3">Page 3</option>
        </select>
        <button className="rounded bg-blue-600 px-3 py-2 text-white">Apply filters</button>
      </form>
      <section className="grid gap-3">
        {bills.map((bill) => <BillCard key={bill.id} bill={bill} />)}
      </section>
    </div>
  );
}
