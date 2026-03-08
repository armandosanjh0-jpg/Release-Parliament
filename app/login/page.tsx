'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? 'Login failed');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Use demo@releaseparliament.ca / demo1234 unless BASIC_AUTH_USERS is configured.</p>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded border p-2" defaultValue="demo@releaseparliament.ca" />
        </label>
        <label className="block text-sm">
          Password
          <input name="password" type="password" required className="mt-1 w-full rounded border p-2" defaultValue="demo1234" />
        </label>
        <button className="rounded bg-blue-600 px-3 py-2 text-white">Sign in</button>
      </form>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </section>
  );
}
