import { NextResponse } from 'next/server';
import { readDb, writeDb, InventoryEntry } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const db = await readDb();
    const sortedInventory = [...db.inventory].sort((a, b) => b.date.localeCompare(a.date));
    return NextResponse.json(sortedInventory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve inventory' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { date, count, type, size, notes } = body;

    if (!date || typeof count !== 'number' || count < 0 || !type || !size) {
      return NextResponse.json({ error: 'Invalid fields. Date, positive Count, Type, and Size are required.' }, { status: 400 });
    }

    const db = await readDb();
    const newEntry: InventoryEntry = {
      id: `inv_${Date.now()}`,
      date,
      count,
      type,
      size,
      notes: notes || '',
    };

    db.inventory.push(newEntry);
    const success = await writeDb(db);

    if (success) {
      return NextResponse.json(newEntry, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Failed to save entry to database' }, { status: 500 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }

    const db = await readDb();
    const initialLength = db.inventory.length;
    db.inventory = db.inventory.filter(entry => entry.id !== id);

    if (db.inventory.length === initialLength) {
      return NextResponse.json({ error: 'Inventory entry not found' }, { status: 404 });
    }

    const success = await writeDb(db);
    if (success) {
      return NextResponse.json({ message: 'Entry deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
