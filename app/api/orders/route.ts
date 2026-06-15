import { NextResponse } from 'next/server';
import { readDb, writeDb, Order, getEggStockSummary } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { sendOrderConfirmationEmail, sendNewOrderAdminAlert, sendOrderStatusUpdateEmail } from '@/lib/email';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const orderId = searchParams.get('id');

    const db = await readDb();

    if (orderId) {
      const order = db.orders.find(o => o.id === orderId);
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      return NextResponse.json(order);
    }

    if (email) {
      const q = email.toLowerCase();
      const customerOrders = db.orders.filter(o => (o.customerEmail || '').toLowerCase().includes(q));
      return NextResponse.json(customerOrders);
    }

    if (phone) {
      const normalize = (s: string) => (s || '').replace(/[^0-9]/g, '');
      const q = normalize(phone);
      const customerOrders = db.orders.filter(o => normalize(o.customerPhone).includes(q));
      return NextResponse.json(customerOrders);
    }

    const sortedOrders = [...db.orders].sort((a, b) => b.orderDate.localeCompare(a.orderDate));
    return NextResponse.json(sortedOrders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, items, pickupDate, notes, adminBypass, paymentMethod, fulfillmentType, deliveryAddress, deliveryLat, deliveryLng } = body;

    if (!customerName || !customerEmail || !customerPhone || !items || !Array.isArray(items) || items.length === 0 || !pickupDate) {
      return NextResponse.json({ error: 'Missing required customer details or order items' }, { status: 400 });
    }

    const resolvedFulfillment = fulfillmentType === 'delivery' ? 'delivery' : 'pickup';
    if (resolvedFulfillment === 'delivery' && (!deliveryAddress || !deliveryAddress.trim())) {
      return NextResponse.json({ error: 'A delivery address is required for Nanyuki delivery orders.' }, { status: 400 });
    }

    // Check if we are ordering eggs, and validate available inventory
    let requestedEggs = 0;
    items.forEach((item: any) => {
      if (item.productId === 'prod_eggs_30') {
        requestedEggs += item.quantity * 30;
      } else if (item.productId === 'prod_eggs_60') {
        requestedEggs += item.quantity * 60;
      }
    });

    if (requestedEggs > 0) {
      const eggSummary = await getEggStockSummary();
      if (eggSummary.available < requestedEggs && !adminBypass) {
        return NextResponse.json({
          error: 'Insufficient egg inventory',
          details: `You requested a total of ${requestedEggs} eggs, but only ${eggSummary.availableTrays} trays (${eggSummary.available} eggs) are currently available.`,
          availableTrays: eggSummary.availableTrays,
          availableEggs: eggSummary.available
        }, { status: 409 });
      }
    }

    const db = await readDb();

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      customerName,
      customerEmail,
      customerPhone,
      items,
      totalPrice: items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
      orderDate: new Date().toISOString(),
      pickupDate,
      status: 'pending',
      notes: notes || '',
      paymentMethod: 'paystack',
      paymentStatus: 'unpaid',
      fulfillmentType: resolvedFulfillment,
      deliveryAddress: resolvedFulfillment === 'delivery' ? deliveryAddress.trim() : '',
      ...(resolvedFulfillment === 'delivery' && typeof deliveryLat === 'number' && typeof deliveryLng === 'number'
        ? { deliveryLat, deliveryLng }
        : {})
    };

    db.orders.push(newOrder);
    const success = await writeDb(db);

    if (success) {
      // For manually logged admin orders, send confirmation emails immediately
      if (adminBypass) {
        sendOrderConfirmationEmail(newOrder).catch((err) =>
          console.error('Error sending order confirmation email:', err)
        );
        sendNewOrderAdminAlert(newOrder).catch((err) =>
          console.error('Error sending admin order alert email:', err)
        );
      }
      return NextResponse.json(newOrder, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['pending', 'ready_for_pickup', 'delivered', 'canceled'].includes(status)) {
      return NextResponse.json({ error: 'ID and valid Status (pending, ready_for_pickup, delivered, canceled) are required' }, { status: 400 });
    }

    const db = await readDb();
    const orderIndex = db.orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    db.orders[orderIndex].status = status as any;
    if (status === 'delivered') {
      db.orders[orderIndex].paymentStatus = 'paid';
    }
    const success = await writeDb(db);

    if (success) {
      const updatedOrder = db.orders[orderIndex];
      // Send notification email to the customer on ready_for_pickup, delivery or cancellation
      if (updatedOrder.status === 'delivered' || updatedOrder.status === 'canceled' || updatedOrder.status === 'ready_for_pickup') {
        sendOrderStatusUpdateEmail(updatedOrder).catch((err) =>
          console.error('Error sending status update email:', err)
        );
      }
      return NextResponse.json(updatedOrder);
    } else {
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

