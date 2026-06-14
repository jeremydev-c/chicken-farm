#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Load .env.local if present to populate environment variables
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        const key = parts[0]?.trim();
        const val = parts.slice(1).join('=').trim();
        if (key && val) {
          // Remove wrapping quotes if present
          let cleanVal = val;
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            cleanVal = val.slice(1, -1);
          }
          process.env[key] = cleanVal;
        }
      }
    });
  }
} catch (err) {
  console.warn('Could not load .env.local file automatically:', err);
}

const PRODUCTS = [
  {
    id: 'prod_eggs_30',
    name: 'Standard Tray (30 eggs)',
    description: 'Grade AA eggs with clean shells, firm whites, and golden yolks. Intended for everyday household cooking.',
    price: 450,
    unit: 'tray (30 eggs)',
    image: '/images/fresh-eggs.jpg',
    inStock: true,
    sku: 'EGGS_30'
  },
  {
    id: 'prod_eggs_60',
    name: 'Large Tray (60 eggs)',
    description: 'Double the quantity for families, cafes, and business kitchens.',
    price: 850,
    unit: 'tray (60 eggs)',
    image: '/images/large-tray.jpg',
    inStock: true,
    sku: 'EGGS_60'
  }
];

async function main() {
  console.log('Starting database reset...');

  // 1. Reset local db.json
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  const initialData = {
    inventory: [],
    orders: [],
    products: PRODUCTS
  };
  
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
    console.log('Local data/db.json has been reset successfully.');
  } catch (err) {
    console.error('Failed to reset local data/db.json:', err);
  }

  // 2. Reset MongoDB if MONGODB_URI is set
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || undefined;

  if (uri) {
    console.log(`Connecting to MongoDB...`);
    const client = new MongoClient(uri);
    try {
      await client.connect();
      const db = client.db(dbName);
      console.log(`Connected to MongoDB database: ${db.databaseName}`);

      // Clear inventory
      await db.collection('inventory').deleteMany({});
      console.log('Cleared inventory collection in MongoDB.');

      // Clear orders
      await db.collection('orders').deleteMany({});
      console.log('Cleared orders collection in MongoDB.');

      // Reset products
      await db.collection('products').deleteMany({});
      await db.collection('products').insertMany(PRODUCTS);
      console.log('Reset products collection to default templates in MongoDB.');

      console.log('MongoDB reset completed successfully.');
    } catch (err) {
      console.error('Failed to reset MongoDB:', err);
    } finally {
      await client.close();
    }
  } else {
    console.log('MONGODB_URI is not set. MongoDB reset skipped.');
  }

  console.log('Database reset process finished.');
}

main();
