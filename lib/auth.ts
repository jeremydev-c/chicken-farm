import { cookies } from 'next/headers';

/**
 * Lightweight admin authentication for the Tabby Premium Eggs control panel.
 *
 * A successful password login sets an httpOnly cookie whose value equals the
 * server-only ADMIN_SESSION_TOKEN. Requests are authorized by comparing the
 * cookie to that token. This is a simple shared-secret session suitable for a
 * single-owner shop and works in both the proxy (edge) and route handlers.
 *
 * Required environment variables (see .env.local):
 *   ADMIN_PASSWORD        - the password the owner types to sign in
 *   ADMIN_SESSION_TOKEN   - a long random string used as the session value
 */

export const ADMIN_COOKIE = 'tabby_admin';

export function getAdminSessionToken(): string | undefined {
  return process.env.ADMIN_SESSION_TOKEN;
}

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

/** True when the provided cookie value matches the configured session token. */
export function isValidAdminValue(value: string | undefined | null): boolean {
  const token = getAdminSessionToken();
  return Boolean(token && value && value === token);
}

/** Server-side check (route handlers / server components) using the cookie store. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidAdminValue(store.get(ADMIN_COOKIE)?.value);
}
