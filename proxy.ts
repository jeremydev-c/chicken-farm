import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy (formerly "middleware") that gates the admin control panel.
 *
 * Any /admin route except the login page requires a valid session cookie,
 * otherwise the visitor is redirected to /admin/login. This keeps the admin
 * area unreachable from the public site.
 */

const ADMIN_COOKIE = 'tabby_admin';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page itself must stay reachable.
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = process.env.ADMIN_SESSION_TOKEN;
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const authenticated = Boolean(token && cookie && cookie === token);

  if (!authenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    if (pathname && pathname !== '/admin') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
