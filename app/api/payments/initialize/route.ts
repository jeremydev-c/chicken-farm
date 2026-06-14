import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import {
  initializeTransaction,
  getPaystackSecretKey,
  PaystackError,
} from '@/lib/paystack';

/**
 * POST /api/payments/initialize
 * Body: { orderId: string }
 *
 * Initializes a Paystack transaction for an existing (already-reserved) order
 * and returns a hosted checkout URL for the client to redirect to.
 */
export async function POST(request: Request) {
  try {
    if (!getPaystackSecretKey()) {
      return NextResponse.json(
        {
          error:
            'Online payment is not configured. Set PAYSTACK_SECRET_KEY in your environment.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    const db = await readDb();
    const order = db.orders.find((o) => o.id === orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'This order has already been paid.' },
        { status: 409 }
      );
    }

    // Reuse an existing reference for this order if one exists, else create one.
    const reference =
      order.paymentReference || `tabby_${order.id}_${Date.now()}`;

    // Resolve the origin to build an absolute callback URL.
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;
    const callbackUrl = `${origin}/checkout/verify`;

    const data = await initializeTransaction({
      email: order.customerEmail,
      amount: order.totalPrice,
      reference,
      callbackUrl,
      metadata: {
        orderId: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
      },
    });

    order.paymentReference = data.reference || reference;
    order.paymentMethod = 'paystack';
    await writeDb(db);

    return NextResponse.json({
      authorizationUrl: data.authorization_url,
      reference: order.paymentReference,
    });
  } catch (err) {
    const message =
      err instanceof PaystackError
        ? err.message
        : 'Failed to initialize payment';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
