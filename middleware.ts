import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';

const COOKIE_NAME = 'cvi_admin_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, login/logout APIs, and public assets
  if (
    pathname === '/admin/login' ||
    pathname === '/api/admin/login' ||
    pathname === '/api/admin/logout' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
