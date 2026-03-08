import Link from 'next/link';
import { cookies } from 'next/headers';
import { getUserFromToken, sessionCookieName } from '@/lib/auth';

export async function AuthStatus() {
  const token = cookies().get(sessionCookieName())?.value;
  const user = getUserFromToken(token);

  if (!user) {
    return <Link href="/login" className="text-sm text-blue-600">Sign in</Link>;
  }

  return (
    <form action="/api/auth/logout" method="post" className="flex items-center gap-2 text-sm">
      <span className="text-slate-600 dark:text-slate-300">{user.name}</span>
      <button className="rounded border px-2 py-1">Sign out</button>
    </form>
  );
}
