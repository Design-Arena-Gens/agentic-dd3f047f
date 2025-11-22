import { NextResponse } from 'next/server';
import { getTokenCookieName } from '@/lib/token';

export function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(getTokenCookieName());
  return response;
}
