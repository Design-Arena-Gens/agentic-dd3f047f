import { NextRequest, NextResponse } from 'next/server';
import { getPairs } from '@/lib/signals';
import { getUserFromRequest } from '@/lib/auth';

export function GET(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ pairs: getPairs() });
}

