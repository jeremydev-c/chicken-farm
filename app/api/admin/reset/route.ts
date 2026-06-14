import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';
import { PRODUCTS } from '@/lib/products';

export async function POST(req: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clearProducts } = await req.json().catch(() => ({ clearProducts: false }));

    // 1. Reset local db.json
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    const initialData = {
      inventory: [],
      orders: [],
      products: clearProducts ? [] : PRODUCTS
    };

    try {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
      console.log('Local data/db.json reset from API.');
    } catch (err: any) {
      console.error('Failed to reset local data/db.json:', err);
    }

    // 2. Reset MongoDB if configured
    const uri = process.env.MONGODB_URI;
    let mongoResetResult = 'skipped';

    if (uri) {
      try {
        const client = await clientPromise;
        if (!client) throw new Error('MongoClient is null');
        const db = client.db(process.env.MONGODB_DB || undefined);

        // Clear inventory
        await db.collection('inventory').deleteMany({});

        // Clear orders
        await db.collection('orders').deleteMany({});

        // Clear or Reset products
        await db.collection('products').deleteMany({});
        if (!clearProducts) {
          await db.collection('products').insertMany(PRODUCTS);
        }

        mongoResetResult = 'success';
        console.log('MongoDB collections reset from API.');
      } catch (err: any) {
        console.error('Failed to reset MongoDB from API:', err);
        mongoResetResult = `error: ${err.message || err}`;
      }
    }

    return NextResponse.json({
      success: mongoResetResult === 'success' || mongoResetResult === 'skipped',
      localReset: true,
      mongoReset: mongoResetResult
    });
  } catch (error: any) {
    console.error('API Admin Reset error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
