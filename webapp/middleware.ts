import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenCookieName } from '@/lib/token';

const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = getTokenCookieName();
  const token = request.cookies.get(cookieName)?.value ?? '';
  const session = token ? verifyToken(token) : null;

  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isAuthRoute = PUBLIC_PATHS.includes(pathname);

  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
};
