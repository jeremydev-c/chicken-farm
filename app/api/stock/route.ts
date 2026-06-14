import { NextResponse } from 'next/server';
import { getEggStockSummary } from '@/lib/db';

/**
 * GET /api/stock
 *
 * Public endpoint returning ONLY egg-availability numbers (no orders, revenue
 * or customer data). Used by the storefront to show live stock.
 */
export async function GET() {
  try {
    const eggStock = await getEggStockSummary();
    return NextResponse.json(eggStock);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load stock' },
      { status: 500 }
    );
  }
}
