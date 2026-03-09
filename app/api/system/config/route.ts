import { NextResponse } from 'next/server';
import { getConfigCheck } from '@/lib/config';

export async function GET() {
  const check = getConfigCheck();
  const status = check.missingRequired.length ? 500 : 200;
  return NextResponse.json(check, { status });
}
