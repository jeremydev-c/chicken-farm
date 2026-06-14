import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { generateInvoicePdf } from '@/lib/pdf';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const db = await readDb();
    const order = db.orders.find(o => o.id === orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const pdfBuffer = await generateInvoicePdf(order);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="tabby_eggs_invoice_${order.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
