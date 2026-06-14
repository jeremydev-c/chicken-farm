import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import {
  verifyTransaction,
  getPaystackSecretKey,
  PaystackError,
} from '@/lib/paystack';
import { sendOrderConfirmationEmail, sendNewOrderAdminAlert } from '@/lib/email';

/**
 * GET /api/payments/verify?reference=...
 *
 * Verifies a Paystack transaction server-side and reconciles the matching
 * order's payment status. Called after Paystack redirects back to the site.
 */
export async function GET(request: Request) {
  try {
    if (!getPaystackSecretKey()) {
      return NextResponse.json(
        { error: 'Online payment is not configured.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reference =
      searchParams.get('reference') || searchParams.get('trxref');

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    const data = await verifyTransaction(reference);
    const paidByGateway = data.status === 'success';

    const db = await readDb();
    const order = db.orders.find((o) => o.paymentReference === reference);

    let confirmed = paidByGateway;

    if (order) {
      // Reconcile the amount in subunits to guard against tampering.
      const expectedSubunits = Math.round(order.totalPrice * 100);
      const amountMatches = data.amount >= expectedSubunits;
      confirmed = paidByGateway && amountMatches;

      order.paymentStatus = confirmed ? 'paid' : 'failed';
      if (confirmed) {
        order.paidAt = data.paid_at || new Date().toISOString();
      }
      await writeDb(db);

      // Send confirmation emails after payment is verified and database is updated
      if (confirmed) {
        sendOrderConfirmationEmail(order).catch((err) =>
          console.error('Error sending order confirmation email:', err)
        );
        sendNewOrderAdminAlert(order).catch((err) =>
          console.error('Error sending admin order alert email:', err)
        );
      }
    }

    return NextResponse.json({
      status: confirmed ? 'success' : 'failed',
      reference,
      order: order || null,
    });
  } catch (err) {
    const message =
      err instanceof PaystackError ? err.message : 'Failed to verify payment';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
