import { NextResponse } from 'next/server';
import { readDb, writeDb, Product } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json(db.products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve products' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id, price, inStock, description, name } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const db = await readDb();
    const productIndex = db.products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentProduct = db.products[productIndex];
    
    // Update fields if provided
    if (price !== undefined && typeof price === 'number') currentProduct.price = price;
    if (inStock !== undefined && typeof inStock === 'boolean') currentProduct.inStock = inStock;
    if (description !== undefined) currentProduct.description = description;
    if (name !== undefined) currentProduct.name = name;

    db.products[productIndex] = currentProduct;
    const success = await writeDb(db);

    if (success) {
      return NextResponse.json(currentProduct);
    } else {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
