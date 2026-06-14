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
    const { id, price, inStock, description, name, unit, image } = body;

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
    if (unit !== undefined) currentProduct.unit = unit;
    if (image !== undefined) currentProduct.image = image;

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

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, price, description, unit, image, inStock } = body;

    if (!name || price === undefined || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await readDb();
    
    // Generate a unique ID
    const id = `prod_custom_${Date.now()}`;
    
    const newProduct: Product = {
      id,
      name,
      price: Number(price),
      description: description || '',
      unit,
      image: image || '/placeholder-product.png',
      inStock: inStock !== undefined ? !!inStock : true
    };

    db.products.push(newProduct);
    const success = await writeDb(db);

    if (success) {
      return NextResponse.json(newProduct, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get ID from query parameter or JSON body
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {
        // Ignore parsing errors and check below
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const db = await readDb();
    const initialLength = db.products.length;
    db.products = db.products.filter(p => p.id !== id);

    if (db.products.length === initialLength) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const success = await writeDb(db);

    if (success) {
      return NextResponse.json({ success: true, message: 'Product deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
