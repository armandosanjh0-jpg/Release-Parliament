'use client';

import Link from 'next/link';
import { useState } from 'react';

export function UserVotePanel({ billId }: { billId: string }) {
  const [message, setMessage] = useState('');

  async function submit(vote: 'Yea' | 'Nay' | 'Abstain') {
    const res = await fetch(`/api/bills/${billId}/user-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote })
    });

    if (res.status === 401) {
      setMessage('Please sign in to cast a vote.');
      return;
    }

    setMessage(res.ok ? `Saved your vote: ${vote}` : 'Failed to save vote');
  }

  return (
    <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800" aria-label="Citizen vote panel">
      <h3 className="font-semibold">Cast your vote</h3>
      <div className="mt-2 flex gap-2">
        <button className="rounded bg-emerald-600 px-3 py-1 text-white" onClick={() => submit('Yea')}>Yea</button>
        <button className="rounded bg-rose-600 px-3 py-1 text-white" onClick={() => submit('Nay')}>Nay</button>
        <button className="rounded bg-slate-600 px-3 py-1 text-white" onClick={() => submit('Abstain')}>Abstain</button>
      </div>
      {message && (
        <p className="mt-2 text-sm">
          {message} {message.includes('sign in') && <Link className="text-blue-600" href="/login">Go to login</Link>}
        </p>
      )}
    </section>
  );
}
