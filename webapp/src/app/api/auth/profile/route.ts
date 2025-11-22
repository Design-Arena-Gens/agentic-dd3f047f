import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getUserFromRequest } from '@/lib/auth';

export function GET(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = store.users.find((item) => item.id === auth.sub);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}

