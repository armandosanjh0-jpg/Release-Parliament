import { VoteBreakdown } from '@/types/parliament';

export function VoteChart({ vote }: { vote?: VoteBreakdown }) {
  if (!vote) return <p className="text-base text-slate-500">No recorded vote totals yet.</p>;
  const total = vote.yea + vote.nay || 1;
  return (
    <div className="space-y-4" aria-label="Vote breakdown chart">
      <div>
        <p className="text-lg font-medium">Yeas: {vote.yea}</p>
        <div className="h-4 rounded bg-slate-200"><div className="h-4 rounded bg-emerald-500" style={{ width: `${(vote.yea / total) * 100}%` }} /></div>
      </div>
      <div>
        <p className="text-lg font-medium">Nays: {vote.nay}</p>
        <div className="h-4 rounded bg-slate-200"><div className="h-4 rounded bg-rose-500" style={{ width: `${(vote.nay / total) * 100}%` }} /></div>
      </div>
    </div>
  );
}
