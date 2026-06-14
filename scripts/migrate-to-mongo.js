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

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || undefined;

  if (!uri) {
    console.error('MONGODB_URI is not set. Aborting migration.');
    process.exit(1);
  }

  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('data/db.json not found. Aborting.');
    process.exit(1);
  }

  let raw;
  try {
    raw = fs.readFileSync(dbPath, 'utf8');
  } catch (err) {
    console.error('Failed to read data/db.json:', err);
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse data/db.json:', err);
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log(`Connected to MongoDB database: ${db.databaseName}`);

    // Migrate inventory
    if (Array.isArray(parsed.inventory)) {
      const inventoryColl = db.collection('inventory');
      let count = 0;
      for (const doc of parsed.inventory) {
        const filter = { id: doc.id };
        await inventoryColl.replaceOne(filter, doc, { upsert: true });
        count++;
      }
      console.log(`Migrated ${count} inventory documents to 'inventory' collection.`);
    } else {
      console.log('No inventory array found in db.json.');
    }

    // Ensure useful indexes
    try {
      const ordersColl = db.collection('orders');
      await ordersColl.createIndex({ customerPhoneNormalized: 1 }, { background: true });
      await ordersColl.createIndex({ customerEmail: 1 }, { background: true });
      const inventoryColl = db.collection('inventory');
      await inventoryColl.createIndex({ productId: 1 }, { background: true });
      console.log('Created indexes: orders.customerPhoneNormalized, orders.customerEmail, inventory.productId');
    } catch (err) {
      console.warn('Index creation failed or skipped:', err.message || err);
    }

    // Migrate products
    if (Array.isArray(parsed.products)) {
      const productsColl = db.collection('products');
      let count = 0;
      for (const doc of parsed.products) {
        try {
          const filter = { id: doc.id };
          await productsColl.replaceOne(filter, doc, { upsert: true });
          count++;
        } catch (err) {
          if (err && err.code === 11000) {
            console.warn(`Skipped product upsert due to duplicate key: ${doc.id} (${err.message})`);
            continue;
          }
          throw err;
        }
      }
      console.log(`Migrated ${count} products to 'products' collection.`);
    } else {
      console.log('No products array found in db.json.');
    }

    // Migrate orders (ensure normalized phone field)
    if (Array.isArray(parsed.orders)) {
      const ordersColl = db.collection('orders');
      let count = 0;
      for (const order of parsed.orders) {
        try {
          const doc = Object.assign({}, order);
          if (doc.customerPhone) {
            doc.customerPhoneNormalized = String(doc.customerPhone).replace(/[^0-9]/g, '');
          }
          const filter = { id: doc.id };
          await ordersColl.replaceOne(filter, doc, { upsert: true });
          count++;
        } catch (err) {
          if (err && err.code === 11000) {
            console.warn(`Skipped order upsert due to duplicate key: ${order.id} (${err.message})`);
            continue;
          }
          throw err;
        }
      }
      console.log(`Migrated ${count} orders to 'orders' collection.`);
    } else {
      console.log('No orders array found in db.json.');
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();

