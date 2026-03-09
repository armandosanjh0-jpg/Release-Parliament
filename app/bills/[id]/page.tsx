import Link from 'next/link';
import { UserVotePanel } from '@/components/UserVotePanel';
import { VoteChart } from '@/components/VoteChart';
import { getBillById } from '@/lib/parliament';

type BillDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function BillDetail({ params }: BillDetailProps) {
  const { id } = await params;
  const bill = await getBillById(id);
  if (!bill) return <p>Bill not found.</p>;

  return (
    <article className="space-y-6">
      <Link href="/" className="text-base font-semibold text-blue-700">← Back to bills</Link>
      <h1 className="text-3xl font-bold leading-tight">{bill.number}: {bill.title}</h1>
      <p className="text-lg text-slate-700 dark:text-slate-200">Session: {bill.session} • Status: {bill.status}</p>
      <p className="text-lg leading-relaxed">{bill.summary}</p>
      {bill.textUrl && <a className="text-lg font-semibold text-blue-700" href={bill.textUrl} target="_blank" rel="noreferrer">Read full text (LEGISinfo)</a>}

      <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
        <h2 className="mb-3 text-2xl font-semibold">Voting history</h2>
        <VoteChart vote={bill.voteBreakdown} />
      </section>

      <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
        <h2 className="mb-3 text-2xl font-semibold">How politicians voted (hover for photo)</h2>
        <ul className="space-y-3">
          {(bill.votes ?? []).map((person) => (
            <li key={`${person.name}-${person.constituency}`} className="group relative rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-lg font-medium">{person.name} • {person.party}</p>
              <p className="text-base text-slate-600 dark:text-slate-300">{person.constituency ?? 'Constituency unavailable'} • Vote: {person.vote}</p>
              {person.imageUrl && (
                <div className="pointer-events-none absolute right-3 top-3 hidden rounded-lg border bg-white p-2 shadow-xl group-hover:block dark:bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={person.imageUrl} alt={`${person.name} portrait`} className="h-28 w-24 rounded object-cover" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <UserVotePanel billId={bill.id} />
    </article>
  );
}
