import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { readDb } from '@/lib/db';

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

    // Generate PDF using pdfkit
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 1. Header (Brand details)
      doc.fillColor('#1a202c').fontSize(24).font('Helvetica-Bold').text('TABBY PREMIUM EGGS', 50, 50);
      doc.fillColor('#718096').fontSize(10).font('Helvetica-Oblique').text('Fresh, Nutritious, & Locally Sourced', 50, 80);

      // Contact Info (Right aligned)
      doc.fillColor('#4a5568').fontSize(9).font('Helvetica')
         .text('Tabby Farm Nanyuki', 350, 50, { width: 195, align: 'right' })
         .text('Nanyuki-Doldol Road, Laikipia', 350, 62, { width: 195, align: 'right' })
         .text('Phone: +254 712 345 678', 350, 74, { width: 195, align: 'right' })
         .text('Email: info@tabbypremiumeggs.com', 350, 86, { width: 195, align: 'right' });

      // Accent divider line
      doc.strokeColor('#d97706').lineWidth(2).moveTo(50, 110).lineTo(545, 110).stroke();

      // Title
      doc.fillColor('#1a202c').fontSize(18).font('Helvetica-Bold').text('INVOICE', 50, 130);

      // Details Columns
      // Left Column: Customer Details
      doc.fillColor('#2d3748').fontSize(10).font('Helvetica-Bold').text('BILLED TO:', 50, 160);
      doc.fillColor('#4a5568').font('Helvetica').fontSize(9)
         .text(order.customerName, 50, 175)
         .text(order.customerEmail, 50, 187)
         .text(order.customerPhone, 50, 199);
      if (order.fulfillmentType === 'delivery' && order.deliveryAddress) {
        doc.text(`Delivery Address: ${order.deliveryAddress}`, 50, 211, { width: 220 });
      } else {
        doc.text('Fulfillment: Farm Pickup', 50, 211);
      }

      // Right Column: Order/Invoice Metadata
      doc.fillColor('#2d3748').fontSize(10).font('Helvetica-Bold').text('INVOICE DETAILS:', 320, 160);
      doc.fillColor('#4a5568').font('Helvetica').fontSize(9)
         .text(`Invoice ID: ${order.id}`, 320, 175)
         .text(`Date Issued: ${new Date(order.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 320, 187)
         .text(`Fulfillment Date: ${new Date(order.pickupDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 320, 199)
         .text(`Fulfillment Type: ${order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}`, 320, 211)
         .text(`Payment: ${order.paymentMethod === 'paystack' ? 'Paid Online via Paystack' : 'Pay on Fulfillment'}`, 320, 223);

      // Itemized Table Header
      let y = 260;
      doc.fillColor('#f7fafc').rect(50, y, 495, 20).fill();
      doc.fillColor('#2d3748').font('Helvetica-Bold').fontSize(9);
      doc.text('Item Description', 60, y + 6);
      doc.text('Unit Price', 270, y + 6, { width: 80, align: 'right' });
      doc.text('Qty', 350, y + 6, { width: 80, align: 'right' });
      doc.text('Subtotal', 430, y + 6, { width: 105, align: 'right' });

      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, y + 20).lineTo(545, y + 20).stroke();
      y += 20;

      // Table Rows
      doc.font('Helvetica').fontSize(9);
      order.items.forEach((item) => {
        doc.fillColor('#4a5568');
        doc.text(item.name, 60, y + 8);
        doc.text(`KES ${item.price.toLocaleString()}`, 270, y + 8, { width: 80, align: 'right' });
        doc.text(String(item.quantity), 350, y + 8, { width: 80, align: 'right' });
        const subtotal = item.price * item.quantity;
        doc.text(`KES ${subtotal.toLocaleString()}`, 430, y + 8, { width: 105, align: 'right' });

        doc.strokeColor('#edf2f7').lineWidth(1).moveTo(50, y + 24).lineTo(545, y + 24).stroke();
        y += 24;
      });

      // Summary Total Row
      y += 15;
      doc.fillColor('#2d3748').font('Helvetica-Bold').fontSize(11).text('Total Amount Due:', 280, y, { width: 140, align: 'right' });
      doc.fillColor('#d97706').font('Helvetica-Bold').fontSize(12).text(`KES ${order.totalPrice.toLocaleString()}`, 430, y, { width: 105, align: 'right' });

      // Draw Paid or Payment Status Stamp
      const isPaid = order.paymentStatus === 'paid' || order.paymentMethod === 'paystack';
      y += 15;
      if (isPaid) {
        doc.save();
        doc.rotate(-10, { origin: [140, y + 25] });
        doc.strokeColor('#10b981').lineWidth(2.5).rect(100, y, 90, 30).stroke();
        doc.fillColor('#10b981').font('Helvetica-Bold').fontSize(14).text('PAID', 100, y + 8, { width: 90, align: 'center' });
        doc.restore();
      } else {
        doc.save();
        doc.rotate(-10, { origin: [140, y + 25] });
        doc.strokeColor('#9ca3af').lineWidth(2).rect(85, y, 120, 30).stroke();
        const stampText = order.fulfillmentType === 'delivery' ? 'PAY ON DELIVERY' : 'PAY ON PICKUP';
        doc.fillColor('#9ca3af').font('Helvetica-Bold').fontSize(10).text(stampText, 85, y + 9, { width: 120, align: 'center' });
        doc.restore();
      }

      // Footer
      doc.strokeColor('#edf2f7').lineWidth(1).moveTo(50, 720).lineTo(545, 720).stroke();
      doc.fillColor('#a0aec0').font('Helvetica').fontSize(8)
         .text('Thank you for choosing Tabby Premium Eggs! We appreciate your business.', 50, 735, { width: 495, align: 'center' })
         .text('For inquiries or assistance, please contact us at support@tabbypremiumeggs.com or visit our farm.', 50, 747, { width: 495, align: 'center' });

      doc.end();
    });

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
