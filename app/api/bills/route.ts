import { NextRequest, NextResponse } from 'next/server';
import { getBills } from '@/lib/parliament';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await getBills({
      page: Number(searchParams.get('page') ?? '1'),
      q: searchParams.get('q') ?? undefined,
      status: searchParams.get('status') ?? undefined
    });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
