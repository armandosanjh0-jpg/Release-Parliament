import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, destroySession, sessionCookieName } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName())?.value;
  destroySession(token);

  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', clearSessionCookie());
  return response;
}
