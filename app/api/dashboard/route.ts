import { NextResponse } from 'next/server';
import { readDb, getEggStockSummary } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = await readDb();
    const eggStock = await getEggStockSummary();

    const pendingOrders = db.orders.filter(o => o.status === 'pending');
    const deliveredOrders = db.orders.filter(o => o.status === 'delivered');

    const pendingOrdersCount = pendingOrders.length;
    const totalPendingRevenue = pendingOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalPrice, 0);

    // Get last 5 collections sorted by date desc
    const recentCollections = [...db.inventory]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    // Get last 5 orders sorted by orderDate desc
    const recentOrders = [...db.orders]
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
      .slice(0, 5);

    // Today's schedule (Nanyuki / Kenya time) - pending orders due today
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Africa/Nairobi',
    });
    const scheduleToday = db.orders
      .filter((o) => o.status === 'pending' && o.pickupDate === today)
      .sort((a, b) => a.customerName.localeCompare(b.customerName));
    const deliveriesTodayCount = scheduleToday.filter(
      (o) => o.fulfillmentType === 'delivery'
    ).length;
    const pickupsTodayCount = scheduleToday.length - deliveriesTodayCount;

    // Smart stock signal: warn when running low (but not yet overbooked)
    const lowStock = !eggStock.isOverbooked && eggStock.availableTrays <= 5;

    // Count of online-paid pending orders awaiting fulfillment
    const paidPendingCount = db.orders.filter(
      (o) => o.status === 'pending' && o.paymentStatus === 'paid'
    ).length;

    // Fulfillment distribution across all active (non-canceled) orders
    const activeOrders = db.orders.filter((o) => o.status !== 'canceled');
    const totalDeliveries = activeOrders.filter((o) => o.fulfillmentType === 'delivery').length;
    const totalPickups = activeOrders.filter((o) => o.fulfillmentType === 'pickup').length;

    // Create a 7-day trend for collections
    // Get unique dates of the last 7 days and sum counts
    const dailyCollections = db.inventory.reduce((acc, entry) => {
      acc[entry.date] = (acc[entry.date] || 0) + entry.count;
      return acc;
    }, {} as Record<string, number>);

    const collectionTrend = Object.entries(dailyCollections)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    return NextResponse.json({
      eggStock,
      pendingOrdersCount,
      totalPendingRevenue,
      totalDeliveredRevenue,
      recentCollections,
      recentOrders,
      collectionTrend,
      scheduleToday,
      deliveriesTodayCount,
      pickupsTodayCount,
      lowStock,
      paidPendingCount,
      totalDeliveries,
      totalPickups,
      today,
    });
  } catch (error) {
    console.error('API Dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
