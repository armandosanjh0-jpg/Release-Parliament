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
    <article className="space-y-4">
      <Link href="/" className="text-sm text-blue-600">← Back to bills</Link>
      <h1 className="text-2xl font-bold">{bill.number}: {bill.title}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">Session: {bill.session} • Status: {bill.status}</p>
      <p>{bill.summary}</p>
      {bill.textUrl && <a className="text-blue-600" href={bill.textUrl} target="_blank" rel="noreferrer">Read full text (LEGISinfo)</a>}
      <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="mb-2 text-lg font-semibold">Voting history</h2>
        <VoteChart vote={bill.voteBreakdown} />
      </section>
      <UserVotePanel billId={bill.id} />
    </article>
  );
}
