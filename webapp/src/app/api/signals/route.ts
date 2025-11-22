import { NextRequest, NextResponse } from 'next/server';
import { getLatestSignals } from '@/lib/signals';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { signals } = await getLatestSignals();
  return NextResponse.json({ signals });
}

