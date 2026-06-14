import fs from 'fs';
import path from 'path';
import { PRODUCTS } from './products';
import clientPromise from './mongodb';

// Define Data Models
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  inStock: boolean;
  sku?: string;
}

export interface InventoryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  count: number; // Number of eggs collected
  type: 'chicken' | 'duck';
  size: 'small' | 'medium' | 'large' | 'mixed';
  notes: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number; // e.g., 2 (meaning 2 units, like 2 dozen)
  price: number; // unit price at checkout
}

export type PaymentMethod = 'on_pickup' | 'paystack';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed';
export type FulfillmentType = 'delivery' | 'pickup';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalPrice: number;
  orderDate: string; // ISO string
  pickupDate: string; // YYYY-MM-DD (the scheduled delivery OR pickup date)
  status: 'pending' | 'fulfilled' | 'canceled';
  notes: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
  paidAt?: string; // ISO string
  fulfillmentType?: FulfillmentType; // 'delivery' (within Nanyuki) or 'pickup'
  deliveryAddress?: string; // required when fulfillmentType === 'delivery'
  deliveryLat?: number; // optional GPS coordinates for the rider
  deliveryLng?: number;
}

export interface DatabaseSchema {
  inventory: InventoryEntry[];
  orders: Order[];
  products: Product[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure the directory and file exist
function initDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initialData: DatabaseSchema = {
      inventory: [],
      orders: [],
      products: PRODUCTS
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

export async function readDb(): Promise<DatabaseSchema> {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      const client = await clientPromise;
      if (!client) throw new Error('MongoClient is null');
      const db = client.db(process.env.MONGODB_DB || undefined);
      
      const inventory = await db.collection('inventory').find({}).toArray();
      const orders = await db.collection('orders').find({}).toArray();
      const products = await db.collection('products').find({}).toArray();
      
      // Clean up MongoDB _id and other properties from results
      const mappedInventory = inventory.map(({ _id, ...rest }) => rest) as any[];
      const mappedOrders = orders.map(({ _id, ...rest }) => rest) as any[];
      const mappedProducts = products.map(({ _id, ...rest }) => rest) as any[];

      // Auto-populate products catalog with defaults if empty
      if (mappedProducts.length === 0) {
        const productsColl = db.collection('products');
        await productsColl.insertMany(PRODUCTS);
        return {
          inventory: mappedInventory,
          orders: mappedOrders,
          products: PRODUCTS
        };
      }
      
      return {
        inventory: mappedInventory,
        orders: mappedOrders,
        products: mappedProducts
      };
    } catch (error) {
      console.error('Failed to read from MongoDB, falling back to local file:', error);
    }
  }

  try {
    initDbFile();
    const data = await fs.promises.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    console.error('Failed to read database file:', error);
    return { inventory: [], orders: [], products: [] };
  }
}

export async function writeDb(data: DatabaseSchema): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      const client = await clientPromise;
      if (!client) throw new Error('MongoClient is null');
      const db = client.db(process.env.MONGODB_DB || undefined);
      
      // Sync products
      const productsColl = db.collection('products');
      try {
        await productsColl.dropIndexes();
      } catch (e) {
        // Ignore if no indexes exist or cannot drop
      }
      for (const item of data.products) {
        const { _id, ...doc } = item as any;
        await productsColl.replaceOne({ id: item.id }, doc, { upsert: true });
      }
      const productIds = data.products.map(p => p.id);
      await productsColl.deleteMany({ id: { $nin: productIds } });
      
      // Sync inventory
      const inventoryColl = db.collection('inventory');
      try {
        await inventoryColl.dropIndexes();
      } catch (e) {
        // Ignore if no indexes exist
      }
      for (const item of data.inventory) {
        const { _id, ...doc } = item as any;
        await inventoryColl.replaceOne({ id: item.id }, doc, { upsert: true });
      }
      const inventoryIds = data.inventory.map(i => i.id);
      await inventoryColl.deleteMany({ id: { $nin: inventoryIds } });
      
      // Sync orders
      const ordersColl = db.collection('orders');
      try {
        await ordersColl.dropIndexes();
      } catch (e) {
        // Ignore if no indexes exist
      }
      for (const item of data.orders) {
        const { _id, ...doc } = item as any;
        if (doc.customerPhone) {
          doc.customerPhoneNormalized = String(doc.customerPhone).replace(/[^0-9]/g, '');
        }
        await ordersColl.replaceOne({ id: item.id }, doc, { upsert: true });
      }
      const orderIds = data.orders.map(o => o.id);
      await ordersColl.deleteMany({ id: { $nin: orderIds } });
      
      return true;
    } catch (error) {
      console.error('Failed to write to MongoDB, falling back to local file:', error);
    }
  }

  try {
    initDbFile();
    await fs.promises.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to write database file:', error);
    return false;
  }
}

/**
 * Calculates egg inventory statistics to determine the safety margins
 * formula: Available Eggs = Total Eggs Collected - Total Eggs Promised in active orders
 */
export async function getEggStockSummary() {
  const db = await readDb();
  
  // Total eggs collected (sum of all chicken inventory entries)
  const totalCollectedEggs = db.inventory
    .filter(entry => entry.type === 'chicken')
    .reduce((sum, entry) => sum + entry.count, 0);

  // Total eggs promised (sum of quantity in pending orders, converted to individual eggs)
  const pendingOrders = db.orders.filter(order => order.status === 'pending');
  
  let totalPromisedEggs = 0;
  pendingOrders.forEach(order => {
    order.items.forEach(item => {
      if (item.productId === 'prod_eggs_30') {
        totalPromisedEggs += item.quantity * 30; // units (trays of 30) * 30
      } else if (item.productId === 'prod_eggs_60') {
        totalPromisedEggs += item.quantity * 60; // units (trays of 60) * 60
      }
    });
  });

  const availableEggs = totalCollectedEggs - totalPromisedEggs;

  return {
    totalCollected: totalCollectedEggs, // individual eggs
    totalCollectedTrays: Math.floor(totalCollectedEggs / 30),
    totalPromised: totalPromisedEggs, // individual eggs
    totalPromisedTrays: Math.floor(totalPromisedEggs / 30),
    available: availableEggs, // individual eggs
    availableTrays: Math.floor(availableEggs / 30),
    isOverbooked: availableEggs < 0
  };
}

