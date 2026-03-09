import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, sessionCookieName } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName())?.value;
  const user = getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ data: user });
}
