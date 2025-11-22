import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { store } from '@/lib/store';
import { getUserFromRequest } from '@/lib/auth';

const schema = z.object({
  minimumSignalQuality: z.number().min(0).max(100),
  indicatorSensitivity: z.number().min(0.2).max(2),
});

export function GET(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ settings: store.settings });
}

export async function PUT(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await request.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  store.settings = parsed.data;
  return NextResponse.json({ settings: store.settings });
}

