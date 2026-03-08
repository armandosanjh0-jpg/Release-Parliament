import { NextRequest, NextResponse } from 'next/server';

const OPEN_PARLIAMENT = process.env.OPEN_PARLIAMENT_API ?? 'https://api.openparliament.ca';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const upstreamParams = new URLSearchParams();

    upstreamParams.set('limit', searchParams.get('limit') ?? '20');
    upstreamParams.set('offset', searchParams.get('offset') ?? '0');
    upstreamParams.set('introduced__gte', searchParams.get('introduced__gte') ?? '2005-01-01');

    const optionalKeys = ['q', 'status_code', 'sponsor_politician', 'law', 'number'];
    optionalKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) upstreamParams.set(key, value);
    });

    const response = await fetch(`${OPEN_PARLIAMENT}/bills/?${upstreamParams.toString()}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenParliament upstream failed with status ${response.status}` },
        { status: 502 }
      );
    }

    const payload = await response.json();
    return NextResponse.json({ data: payload });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
