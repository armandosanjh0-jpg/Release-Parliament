import Link from 'next/link';
import { Bill } from '@/types/parliament';

export function BillCard({ bill }: { bill: Bill }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500">{bill.session}</p>
      <h2 className="text-lg font-semibold">{bill.number}: {bill.title}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Status: {bill.status}</p>
      <p className="mt-2 text-sm">{bill.summary}</p>
      <Link className="mt-3 inline-block text-sm font-medium text-blue-600" href={`/bills/${bill.id}`}>View details →</Link>
    </article>
  );
}
