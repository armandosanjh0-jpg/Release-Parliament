import { NextResponse } from 'next/server';
import { authenticate, buildSessionCookie, createSession } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body?.email ? String(body.email) : '';
  const password = body?.password ? String(body.password) : '';

  const user = authenticate(email, password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = createSession(user);
  const response = NextResponse.json({ data: user });
  response.headers.set('Set-Cookie', buildSessionCookie(token));
  return response;
}
