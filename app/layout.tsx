import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AuthStatus } from '@/components/AuthStatus';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <Link href="/" className="font-semibold">Release Parliament Canada</Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span>Bills • Votes • Citizen Compare</span>
              <AuthStatus />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
