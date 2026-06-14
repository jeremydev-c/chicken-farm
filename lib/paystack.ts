/**
 * Paystack server-side helper.
 *
 * Uses the Paystack REST API directly (no SDK dependency). All calls must run
 * on the server because they require the secret key.
 *
 * Required environment variables (see .env.local):
 *   PAYSTACK_SECRET_KEY   - your Paystack secret key (sk_test_... / sk_live_...)
 *   PAYSTACK_CURRENCY     - optional, defaults to "KES"
 */

const PAYSTACK_BASE = 'https://api.paystack.co';

export function getPaystackSecretKey(): string | undefined {
  return process.env.PAYSTACK_SECRET_KEY;
}

export function getPaystackCurrency(): string {
  return process.env.PAYSTACK_CURRENCY || 'KES';
}

export interface InitializeParams {
  email: string;
  /** Amount in the major currency unit (e.g. KES). Converted to subunits here. */
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyData {
  status: string; // "success" | "failed" | "abandoned" | ...
  reference: string;
  amount: number; // in subunits
  currency: string;
  paid_at: string | null;
  channel: string | null;
  customer?: { email?: string };
  metadata?: Record<string, unknown>;
}

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

class PaystackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaystackError';
  }
}

async function paystackFetch<T>(
  path: string,
  init: RequestInit
): Promise<PaystackResponse<T>> {
  const secret = getPaystackSecretKey();
  if (!secret) {
    throw new PaystackError(
      'PAYSTACK_SECRET_KEY is not configured. Add it to your .env.local file.'
    );
  }

  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    // Never cache payment calls
    cache: 'no-store',
  });

  const json = (await res.json().catch(() => null)) as
    | PaystackResponse<T>
    | null;

  if (!res.ok || !json || json.status === false) {
    const message =
      json?.message || `Paystack request failed (${res.status})`;
    throw new PaystackError(message);
  }

  return json;
}

/**
 * Initialize a transaction and get a hosted checkout URL to redirect the
 * customer to. Amount is provided in the major unit and converted to subunits.
 */
export async function initializeTransaction(
  params: InitializeParams
): Promise<PaystackInitializeData> {
  const res = await paystackFetch<PaystackInitializeData>(
    '/transaction/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        email: params.email,
        amount: Math.round(params.amount * 100), // major unit -> subunit
        currency: getPaystackCurrency(),
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
      }),
    }
  );
  return res.data;
}

/**
 * Verify a transaction by its reference. Returns the transaction data so the
 * caller can confirm `status === "success"` and reconcile the amount.
 */
export async function verifyTransaction(
  reference: string
): Promise<PaystackVerifyData> {
  const res = await paystackFetch<PaystackVerifyData>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: 'GET' }
  );
  return res.data;
}

export { PaystackError };
