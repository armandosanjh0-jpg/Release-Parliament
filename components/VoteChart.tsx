import { VoteBreakdown } from '@/types/parliament';

export function VoteChart({ vote }: { vote?: VoteBreakdown }) {
  if (!vote) return <p className="text-sm text-slate-500">No recorded vote totals yet.</p>;
  const total = vote.yea + vote.nay || 1;
  return (
    <div className="space-y-2" aria-label="Vote breakdown chart">
      <div>
        <p className="text-sm">Yeas: {vote.yea}</p>
        <div className="h-2 rounded bg-slate-200"><div className="h-2 rounded bg-emerald-500" style={{ width: `${(vote.yea / total) * 100}%` }} /></div>
      </div>
      <div>
        <p className="text-sm">Nays: {vote.nay}</p>
        <div className="h-2 rounded bg-slate-200"><div className="h-2 rounded bg-rose-500" style={{ width: `${(vote.nay / total) * 100}%` }} /></div>
      </div>
    </div>
  );
}
