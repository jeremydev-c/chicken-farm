const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'fashion-fit';
  if (!uri) {
    console.error('MONGODB_URI not provided. Set env and rerun.');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log('Connected to', dbName);

    const inventoryColl = db.collection('inventory');
    const ordersColl = db.collection('orders');

    // Check for summary doc
    const summary = await inventoryColl.findOne({ productId: 'prod_eggs' });
    let availableEggs = 0;
    if (summary && typeof summary.stock === 'number') {
      availableEggs = summary.stock;
      console.log('Found summary doc: stock =', availableEggs);
    } else {
      const agg = await inventoryColl.aggregate([
        { $match: { type: 'chicken' } },
        { $group: { _id: null, total: { $sum: '$count' } } }
      ]).toArray();
      availableEggs = (agg[0] && agg[0].total) || 0;
      console.log('Computed available eggs by summing counts =', availableEggs);
    }

    // Compute promised eggs from pending orders
    const pendingOrders = await ordersColl.find({ status: 'pending' }).toArray();
    let promisedEggs = 0;
    pendingOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId === 'prod_eggs_30') promisedEggs += item.quantity * 30;
        if (item.productId === 'prod_eggs_60') promisedEggs += item.quantity * 60;
      });
    });

    console.log('Pending orders count:', pendingOrders.length);
    console.log('Promised eggs (pending):', promisedEggs);

    console.log('Available eggs:', availableEggs);
    console.log('Net available (available - promised):', availableEggs - promisedEggs);

    // Show sample pending orders
    if (pendingOrders.length > 0) {
      console.log('\nSample pending orders:');
      pendingOrders.slice(0, 10).forEach(o => {
        console.log('-', o.id, '-', o.customerName, '-', o.items.map(i => `${i.quantity}x${i.productId}`).join(', '));
      });
    }
  } catch (err) {
    console.error('Error checking inventory:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
