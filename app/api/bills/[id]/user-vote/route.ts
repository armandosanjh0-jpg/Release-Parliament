import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { insertUserVote, listVotesForBill } from '@/lib/db';
import { getUserFromToken, sessionCookieName } from '@/lib/auth';

const voteSchema = z.object({ vote: z.enum(['Yea', 'Nay', 'Abstain']) });

function getAuthUser(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName())?.value;
  return getUserFromToken(token);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ data: listVotesForBill(params.id) });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid vote payload' }, { status: 400 });
  }

  const row = insertUserVote({
    userId: user.id,
    billId: params.id,
    vote: parsed.data.vote
  });

  return NextResponse.json({ data: row }, { status: 201 });
}
