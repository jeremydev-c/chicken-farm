import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  getAdminPassword,
  getAdminSessionToken,
} from '@/lib/auth';

/**
 * POST /api/admin/login
 * Body: { password: string }
 *
 * Validates the password against ADMIN_PASSWORD and, on success, sets an
 * httpOnly session cookie.
 */
export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const expected = getAdminPassword();
    const token = getAdminSessionToken();

    if (!expected || !token) {
      return NextResponse.json(
        {
          error:
            'Admin login is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_TOKEN.',
        },
        { status: 503 }
      );
    }

    if (!password || password !== expected) {
      return NextResponse.json(
        { error: 'Incorrect password.' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
