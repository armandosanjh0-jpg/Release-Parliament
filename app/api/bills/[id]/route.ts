import { NextResponse } from 'next/server';
import { getBillById } from '@/lib/parliament';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const bill = await getBillById(params.id);
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
  return NextResponse.json({ data: bill });
}
