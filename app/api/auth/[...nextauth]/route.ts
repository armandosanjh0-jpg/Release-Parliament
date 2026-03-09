import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Basic auth is available at /api/auth/login, /api/auth/logout, /api/auth/me.'
  });
}

export const POST = GET;
