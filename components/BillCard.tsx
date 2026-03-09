import Link from 'next/link';
import { Bill } from '@/types/parliament';

export function BillCard({ bill }: { bill: Bill }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500">{bill.session}</p>
      <h2 className="mt-1 text-2xl font-semibold">{bill.number}: {bill.title}</h2>
      <p className="mt-1 text-lg text-slate-700 dark:text-slate-200">Status: {bill.status}</p>
      <p className="mt-2 text-base leading-relaxed">{bill.summary}</p>
      <Link className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-base font-semibold text-white" href={`/bills/${bill.id}`}>Open bill details</Link>
    </article>
  );
}
